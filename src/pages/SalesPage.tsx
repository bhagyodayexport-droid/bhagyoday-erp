import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Quotation } from "../types";
import { TrendingUp, TrendingDown, DollarSign, FileText, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface MonthlyData {
  month: string;
  revenue: number;
  count: number;
  losses: number;
}

const SalesPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setQuotations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation)));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Aggregate by month
  const monthlyMap: Record<string, MonthlyData> = {};
  quotations.forEach((q) => {
    if (!q.rawDate) return;
    const month = q.rawDate.substring(0, 7); // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = { month, revenue: 0, count: 0, losses: 0 };
    }
    monthlyMap[month].count++;
    if (["Material Dispatched", "Approved", "Closed"].includes(q.status)) {
      monthlyMap[month].revenue += parseFloat(q.grandTotal || "0");
    }
    if (["Deal Loss", "Rejected"].includes(q.status)) {
      monthlyMap[month].losses++;
    }
  });

  const monthly = Object.values(monthlyMap).sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalQuotes = quotations.length;
  const wonQuotes = quotations.filter((q) =>
    ["Material Dispatched", "Approved", "Closed"].includes(q.status)
  ).length;
  const lostQuotes = quotations.filter((q) =>
    ["Deal Loss", "Rejected"].includes(q.status)
  ).length;
  const winRate = totalQuotes > 0 ? Math.round((wonQuotes / totalQuotes) * 100) : 0;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={clsx("p-2.5 rounded-lg", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Sales Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={FileText}
          label="Total Quotes"
          value={totalQuotes}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Win Rate"
          value={`${winRate}%`}
          color="bg-teal-50 text-teal-600"
        />
        <StatCard
          icon={TrendingDown}
          label="Lost Deals"
          value={lostQuotes}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Monthly Breakdown</h3>
        </div>
        {monthly.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            No data available yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Month</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Quotes</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Revenue</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">
                    Lost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthly.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {new Date(m.month + "-01").toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{m.count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      ₹{m.revenue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 hidden sm:table-cell">
                      {m.losses}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
