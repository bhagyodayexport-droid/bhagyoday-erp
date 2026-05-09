import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Quotation, InventoryItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import {
  FileText,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Sent: "bg-yellow-100 text-yellow-700",
  "Awaiting Client": "bg-orange-100 text-orange-700",
  "In Production": "bg-purple-100 text-purple-700",
  "Material Dispatched": "bg-teal-100 text-teal-700",
  Approved: "bg-green-100 text-green-700",
  "Deal Loss": "bg-red-100 text-red-700",
  Closed: "bg-slate-100 text-slate-600",
};

const Dashboard: React.FC = () => {
  const { appUser } = useAuth();
  const { settings } = useSettings();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "quotations"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setQuotations(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem))
      );
    });
    return unsub;
  }, []);

  const totalRevenue = quotations
    .filter((q) => q.status === "Material Dispatched" || q.status === "Approved")
    .reduce((sum, q) => sum + parseFloat(q.grandTotal || "0"), 0);

  const activeQuotations = quotations.filter(
    (q) => !["Deal Loss", "Rejected", "Closed"].includes(q.status)
  ).length;

  const lowStockItems = inventory.filter(
    (item) =>
      item.remainingStockRFT <= (item.lowStockThreshold ?? 100)
  );

  const recentQuotations = quotations.slice(0, 8);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    sub,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={clsx("p-2.5 rounded-lg", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Welcome back, {appUser?.displayName || appUser?.email?.split("@")[0]}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          {settings.company?.name} — Dashboard Overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Quotations"
          value={quotations.length}
          sub="All time"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Clock}
          label="Active Quotes"
          value={activeQuotations}
          sub="In progress"
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          sub="Dispatched + Approved"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Package}
          label="Low Stock"
          value={lowStockItems.length}
          sub="Items below threshold"
          color={
            lowStockItems.length > 0
              ? "bg-red-50 text-red-600"
              : "bg-slate-50 text-slate-500"
          }
        />
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-red-700 text-sm">
              Low Stock Alerts ({lowStockItems.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg px-3 py-2 border border-red-100 text-sm"
              >
                <p className="font-medium text-slate-700">
                  {item.make} — {item.colour}
                </p>
                <p className="text-red-600 text-xs">
                  {item.remainingStockRFT} RFT remaining
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent quotations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Recent Quotations</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {recentQuotations.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              No quotations yet. Create your first one!
            </div>
          ) : (
            recentQuotations.map((q) => (
              <div
                key={q.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    #{q.estNo} — {q.custName}
                  </p>
                  <p className="text-xs text-slate-400">{q.rawDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">
                    ₹{parseFloat(q.grandTotal || "0").toLocaleString("en-IN")}
                  </span>
                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_COLORS[q.status] || "bg-slate-100 text-slate-600"
                    )}
                  >
                    {q.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
