import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Quotation, QuotationStatus } from "../types";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

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

const STATUSES: QuotationStatus[] = [
  "New", "Sent", "Awaiting Client", "In Production",
  "Material Dispatched", "Negotiation", "Approved",
  "Deal Loss", "Rejected", "Closed",
];

const HistoryPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setQuotations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleStatusChange = async (id: string, status: QuotationStatus) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "quotations", id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = quotations.filter((q) => {
    const matchSearch =
      q.custName.toLowerCase().includes(search.toLowerCase()) ||
      q.estNo.includes(search);
    const matchStatus = filterStatus === "All" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Quotation History</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer or estimate #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

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
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No records found
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
                      <td className="px-4 py-3">
                        <select
                          value={q.status}
                          onChange={(e) =>
                            handleStatusChange(q.id!, e.target.value as QuotationStatus)
                          }
                          disabled={updatingId === q.id}
                          className={clsx(
                            "text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400",
                            STATUS_COLORS[q.status] || "bg-slate-100 text-slate-600"
                          )}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
