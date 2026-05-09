import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { Quotation, QuotationItem, QuotationStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  MessageCircle,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";

const STATUSES: QuotationStatus[] = [
  "New",
  "Sent",
  "Awaiting Client",
  "In Production",
  "Material Dispatched",
  "Negotiation",
  "Approved",
  "Deal Loss",
  "Rejected",
  "Closed",
];

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Sent: "bg-yellow-100 text-yellow-700",
  "Awaiting Client": "bg-orange-100 text-orange-700",
  "In Production": "bg-purple-100 text-purple-700",
  "Material Dispatched": "bg-teal-100 text-teal-700",
  Approved: "bg-green-100 text-green-700",
  "Deal Loss": "bg-red-100 text-red-700",
  Rejected: "bg-red-100 text-red-700",
  Closed: "bg-slate-100 text-slate-600",
  Negotiation: "bg-indigo-100 text-indigo-700",
};

const EMPTY_ITEM: QuotationItem = { name: "", qty: 0, len: 0, pcs: 0, rate: 0, total: 0 };

const QuotationsPage: React.FC = () => {
  const { appUser } = useAuth();
  const { settings, saveSettings } = useSettings();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState<Partial<Quotation>>({
    custName: "",
    waNo: "",
    rawDate: new Date().toISOString().split("T")[0],
    notes: "",
    items: [{ ...EMPTY_ITEM }],
    status: "New",
    loadV: "0",
    freightV: "0",
  });

  useEffect(() => {
    const q = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setQuotations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const calcTotals = (items: QuotationItem[], loadV = "0", freightV = "0") => {
    const gross = items.reduce((s, i) => s + (i.qty * i.rate), 0);
    const load = parseFloat(loadV) || 0;
    const freight = parseFloat(freightV) || 0;
    const subtotal = gross + load + freight;
    const gstAmt = subtotal * 0.18;
    const grandTotal = subtotal + gstAmt;
    return {
      gross: gross.toFixed(2),
      gstAmt: gstAmt.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const updateItem = (idx: number, field: keyof QuotationItem, value: string | number) => {
    const items = [...(form.items || [])];
    const item = { ...items[idx], [field]: value };
    item.total = item.qty * item.rate;
    items[idx] = item;
    setForm((f) => ({ ...f, items }));
  };

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...(f.items || []), { ...EMPTY_ITEM }] }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }));

  const openNew = () => {
    setEditingId(null);
    setForm({
      custName: "",
      waNo: "",
      rawDate: new Date().toISOString().split("T")[0],
      notes: "",
      items: [{ ...EMPTY_ITEM }],
      status: "New",
      loadV: "0",
      freightV: "0",
    });
    setShowForm(true);
  };

  const openEdit = (q: Quotation) => {
    setEditingId(q.id || null);
    setForm({ ...q });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.custName || !form.rawDate) return;
    setSaving(true);
    try {
      const totals = calcTotals(form.items || [], form.loadV, form.freightV);
      if (editingId) {
        await updateDoc(doc(db, "quotations", editingId), {
          ...form,
          ...totals,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Increment counter
        const counter = settings.estCounter || 1;
        const estNo = String(counter).padStart(4, "0");
        await addDoc(collection(db, "quotations"), {
          ...form,
          ...totals,
          estNo,
          createdBy: appUser?.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await saveSettings({ estCounter: counter + 1 });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quotation?")) return;
    await deleteDoc(doc(db, "quotations", id));
  };

  const handleWhatsApp = (q: Quotation) => {
    const text = `*Quotation #${q.estNo}*\nCustomer: ${q.custName}\nDate: ${q.rawDate}\nTotal: ₹${parseFloat(q.grandTotal).toLocaleString("en-IN")}\nStatus: ${q.status}`;
    const url = `https://wa.me/${q.waNo.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const filtered = quotations.filter(
    (q) =>
      q.custName.toLowerCase().includes(search.toLowerCase()) ||
      q.estNo.includes(search)
  );

  const totals = calcTotals(form.items || [], form.loadV, form.freightV);
  const isAdmin = appUser?.role === "admin" || appUser?.role === "developer";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Quotations</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer or estimate #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No quotations found
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">#{q.estNo}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{q.custName}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{q.rawDate}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        ₹{parseFloat(q.grandTotal || "0").toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={clsx(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            STATUS_COLORS[q.status] || "bg-slate-100 text-slate-600"
                          )}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {q.waNo && (
                            <button
                              onClick={() => handleWhatsApp(q)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Send WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(q)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(q.id!)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">
                {editingId ? "Edit Quotation" : "New Quotation"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={form.custName || ""}
                    onChange={(e) => setForm((f) => ({ ...f, custName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={form.waNo || ""}
                    onChange={(e) => setForm((f) => ({ ...f, waNo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="91XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.rawDate || ""}
                    onChange={(e) => setForm((f) => ({ ...f, rawDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select
                    value={form.status || "New"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as QuotationStatus }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Items</label>
                  <button
                    onClick={addItem}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {(form.items || []).map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        className="col-span-4 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty || ""}
                        onChange={(e) => updateItem(idx, "qty", parseFloat(e.target.value) || 0)}
                        className="col-span-2 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate || ""}
                        onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                        className="col-span-2 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <div className="col-span-3 text-xs text-right text-slate-600 font-medium">
                        ₹{(item.qty * item.rate).toLocaleString("en-IN")}
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loading Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={form.loadV || "0"}
                    onChange={(e) => setForm((f) => ({ ...f, loadV: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Freight Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={form.freightV || "0"}
                    onChange={(e) => setForm((f) => ({ ...f, freightV: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Gross</span>
                  <span>₹{parseFloat(totals.gross).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span>₹{parseFloat(totals.gstAmt).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-1 mt-1">
                  <span>Grand Total</span>
                  <span>₹{parseFloat(totals.grandTotal).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : "Save Quotation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsPage;
