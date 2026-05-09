import React, { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { AppSettings, EmpPermissions } from "../types";
import { Save, Loader2 } from "lucide-react";

const SettingsPage: React.FC = () => {
  const { settings, saveSettings } = useSettings();
  const { appUser } = useAuth();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAdmin = appUser?.role === "admin" || appUser?.role === "developer";

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const setCompany = (key: string, value: string) =>
    setForm((f) => ({ ...f, company: { ...f.company, [key]: value } }));

  const setPdfCfg = (key: string, value: string) =>
    setForm((f) => ({ ...f, pdfCfg: { ...f.pdfCfg, [key]: value } }));

  const setPermission = (key: keyof EmpPermissions, value: boolean) =>
    setForm((f) => ({
      ...f,
      empPermissions: { ...(f.empPermissions as EmpPermissions), [key]: value },
    }));

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>You don't have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
          Company Information
        </h3>
        {(
          [
            { key: "name", label: "Company Name" },
            { key: "gst", label: "GST Number" },
            { key: "addr1", label: "Address" },
            { key: "phone", label: "Phone" },
            { key: "social", label: "Social / Website" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input
              type="text"
              value={(form.company?.[key] as string) || ""}
              onChange={(e) => setCompany(key, e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}
      </div>

      {/* PDF Config */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
          PDF / Quote Configuration
        </h3>
        {(
          [
            { key: "bank", label: "Bank Details" },
            { key: "terms", label: "Terms & Conditions" },
            { key: "footer", label: "Footer Text" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <textarea
              value={(form.pdfCfg?.[key] as string) || ""}
              onChange={(e) => setPdfCfg(key, e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        ))}
      </div>

      {/* Employee Permissions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
          Employee Permissions
        </h3>
        <p className="text-xs text-slate-500">
          Control which sections employees (non-admin users) can access.
        </p>
        {(
          [
            { key: "canAccessHistory", label: "Quotation History" },
            { key: "canAccessClients", label: "Clients" },
            { key: "canAccessSales", label: "Sales Analytics" },
            { key: "canAccessSettings", label: "Settings" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-700">{label}</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.empPermissions?.[key] ?? false}
                onChange={(e) => setPermission(key, e.target.checked)}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  form.empPermissions?.[key] ? "bg-blue-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.empPermissions?.[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Misc */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2">
          Miscellaneous
        </h3>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            WhatsApp Group Link
          </label>
          <input
            type="text"
            value={form.groupLink || ""}
            onChange={(e) => setForm((f) => ({ ...f, groupLink: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Google Apps Script URL (Sync)
          </label>
          <input
            type="text"
            value={form.scriptUrl || ""}
            onChange={(e) => setForm((f) => ({ ...f, scriptUrl: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Estimate Counter (next #)
          </label>
          <input
            type="number"
            value={form.estCounter || 1}
            onChange={(e) =>
              setForm((f) => ({ ...f, estCounter: parseInt(e.target.value) || 1 }))
            }
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
