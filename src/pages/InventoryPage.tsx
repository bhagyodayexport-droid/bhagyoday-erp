import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { InventoryItem } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { clsx } from "clsx";

const InventoryPage: React.FC = () => {
  const { appUser } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<InventoryItem>>({
    make: "",
    colour: "",
    thickness: "",
    gsm: "",
    originalStockRFT: 0,
    remainingStockRFT: 0,
    lowStockThreshold: 100,
  });

  const isAdmin = appUser?.role === "admin" || appUser?.role === "developer";

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({
      make: "",
      colour: "",
      thickness: "",
      gsm: "",
      originalStockRFT: 0,
      remainingStockRFT: 0,
      lowStockThreshold: 100,
    });
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id || null);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.make || !form.colour) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "inventory", editingId), {
          ...form,
          lastUpdated: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "inventory"), {
          ...form,
          usedStockRFT: 0,
          pendingRFT: 0,
          lastUpdated: serverTimestamp(),
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    await deleteDoc(doc(db, "inventory", id));
  };

  const filtered = items.filter(
    (item) =>
      item.make.toLowerCase().includes(search.toLowerCase()) ||
      item.colour.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Inventory</h2>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by make or colour…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              No inventory items found
            </div>
          ) : (
            filtered.map((item) => {
              const isLow = item.remainingStockRFT <= (item.lowStockThreshold ?? 100);
              const pct = item.originalStockRFT > 0
                ? Math.round((item.remainingStockRFT / item.originalStockRFT) * 100)
                : 0;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "bg-white rounded-xl border shadow-sm p-4",
                    isLow ? "border-red-200" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-700">{item.make}</h3>
                      <p className="text-sm text-slate-500">{item.colour}</p>
                      {(item.thickness || item.gsm) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[item.thickness && `${item.thickness}mm`, item.gsm && `${item.gsm} GSM`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    {isLow && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Remaining</span>
                      <span className={clsx("font-semibold", isLow ? "text-red-600" : "text-slate-700")}>
                        {item.remainingStockRFT.toLocaleString()} RFT
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={clsx(
                          "h-1.5 rounded-full transition-all",
                          pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Original: {item.originalStockRFT.toLocaleString()} RFT</span>
                      <span>{pct}%</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">
                {editingId ? "Edit Item" : "Add Inventory Item"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { key: "make", label: "Make / Brand *", type: "text" },
                    { key: "colour", label: "Colour *", type: "text" },
                    { key: "thickness", label: "Thickness (mm)", type: "text" },
                    { key: "gsm", label: "GSM", type: "text" },
                    { key: "originalStockRFT", label: "Original Stock (RFT)", type: "number" },
                    { key: "remainingStockRFT", label: "Remaining Stock (RFT)", type: "number" },
                    { key: "lowStockThreshold", label: "Low Stock Threshold", type: "number" },
                  ] as const
                ).map(({ key, label, type }) => (
                  <div key={key} className={key === "make" || key === "colour" ? "" : ""}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(form as Record<string, unknown>)[key] as string ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                        }))
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ))}
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
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
