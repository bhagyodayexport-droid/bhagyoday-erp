import React, { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  permKey?: keyof import("../types").EmpPermissions;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Quotations", path: "/quotations", icon: FileText },
  { label: "History", path: "/history", icon: FileText, permKey: "canAccessHistory" },
  { label: "Clients", path: "/clients", icon: Users, permKey: "canAccessClients" },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Sales", path: "/sales", icon: BarChart2, permKey: "canAccessSales" },
  { label: "Settings", path: "/settings", icon: Settings, permKey: "canAccessSettings" },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { appUser, signOut } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = appUser?.role === "admin" || appUser?.role === "developer";
  const perms = settings.empPermissions;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isAdmin) return true;
    if (item.permKey && perms) return perms[item.permKey];
    return true;
  });

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={clsx(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          active
            ? "bg-blue-600 text-white shadow-md"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
        {active && <ChevronRight className="w-3 h-3 ml-auto" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10">
        <h1 className="text-lg font-bold text-white truncate">
          {settings.company?.name || "Bhagyoday ERP"}
        </h1>
        <p className="text-xs text-blue-300 mt-0.5 truncate">{appUser?.email}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-60 h-full bg-slate-900 shadow-xl">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-sm">
            {settings.company?.name || "Bhagyoday ERP"}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
