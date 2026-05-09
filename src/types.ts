// ─── User ────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "employee" | "developer";

export interface EmpPermissions {
  canAccessHistory: boolean;
  canAccessClients: boolean;
  canAccessSales: boolean;
  canAccessSettings: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  empPermissions?: EmpPermissions;
  createdAt?: string;
  updatedAt?: string;
  lastSeen?: string;
}

// ─── Quotation ───────────────────────────────────────────────────────────────
export type QuotationStatus =
  | "New"
  | "Sent"
  | "Awaiting Client"
  | "In Production"
  | "Material Dispatched"
  | "Negotiation"
  | "Approved"
  | "Deal Loss"
  | "Rejected"
  | "Closed";

export interface QuotationItem {
  name: string;
  qty: number;
  len: number;
  pcs: number;
  rate: number;
  total: number;
}

export interface Quotation {
  id?: string;
  estNo: string;
  custName: string;
  waNo: string;
  date?: string;
  rawDate: string;
  notes?: string;
  items: QuotationItem[];
  loadV?: string;
  freightV?: string;
  gross?: string;
  gstAmt?: string;
  grandTotal: string;
  status: QuotationStatus;
  reason?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────
export interface Client {
  id?: string;
  name: string;
  number?: string;
  lastDate?: string;
  updatedAt?: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryItem {
  id?: string;
  make: string;
  colour: string;
  thickness?: string;
  gsm?: string;
  originalStockRFT: number;
  remainingStockRFT: number;
  usedStockRFT?: number;
  pendingRFT?: number;
  lowStockThreshold?: number;
  lastUpdated?: string;
  lastAlertSentAt?: string;
}

// ─── Dispatch Log ────────────────────────────────────────────────────────────
export interface DispatchLog {
  id?: string;
  quotationId: string;
  dispatchId?: string;
  materialKey: string;
  qtyDeducted: number;
  createdAt?: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────
export interface CompanyInfo {
  name: string;
  logo?: string;
  gst?: string;
  addr1?: string;
  phone?: string;
  social?: string;
  qrCode?: string;
}

export interface PdfConfig {
  bank?: string;
  terms?: string;
  footer?: string;
}

export interface AppSettings {
  company: CompanyInfo;
  pdfCfg: PdfConfig;
  groupLink?: string;
  scriptUrl?: string;
  rates?: Array<{ label: string; value: number }>;
  descTmpls?: string[];
  estCounter: number;
  empPermissions?: EmpPermissions;
  updatedAt?: string;
}
