import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { AppSettings } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  company: { name: "Bhagyoday Roof Industry" },
  pdfCfg: {},
  estCounter: 1,
  empPermissions: {
    canAccessHistory: true,
    canAccessClients: true,
    canAccessSales: false,
    canAccessSettings: false,
  },
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  saveSettings: (data: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "settings", "global");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as AppSettings) });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const saveSettings = async (data: Partial<AppSettings>) => {
    const ref = doc(db, "settings", "global");
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
