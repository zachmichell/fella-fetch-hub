import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ActiveStaffCode = {
  id: string;
  display_name: string;
  role: string;
};

type Ctx = {
  activeStaff: ActiveStaffCode | null;
  setActiveStaff: (s: ActiveStaffCode | null) => void;
  clearActiveStaff: () => void;
};

const StaffCodeCtx = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "snout_active_staff_code";

export function StaffCodeProvider({ children }: { children: ReactNode }) {
  const { membership } = useAuth();
  const [activeStaff, setActiveStaffState] = useState<ActiveStaffCode | null>(null);

  // Load from sessionStorage on mount / when org changes
  useEffect(() => {
    if (!membership?.organization_id) {
      setActiveStaffState(null);
      return;
    }
    try {
      const raw = sessionStorage.getItem(`${STORAGE_KEY}_${membership.organization_id}`);
      if (raw) setActiveStaffState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [membership?.organization_id]);

  const setActiveStaff = useCallback(
    (s: ActiveStaffCode | null) => {
      setActiveStaffState(s);
      if (!membership?.organization_id) return;
      const k = `${STORAGE_KEY}_${membership.organization_id}`;
      if (s) {
        sessionStorage.setItem(k, JSON.stringify(s));
      } else {
        sessionStorage.removeItem(k);
      }
    },
    [membership?.organization_id],
  );

  const clearActiveStaff = useCallback(() => setActiveStaff(null), [setActiveStaff]);

  return (
    <StaffCodeCtx.Provider value={{ activeStaff, setActiveStaff, clearActiveStaff }}>
      {children}
    </StaffCodeCtx.Provider>
  );
}

export function useActiveStaff() {
  const ctx = useContext(StaffCodeCtx);
  if (!ctx) {
    // Safe fallback so components outside the provider don't crash
    return { activeStaff: null, setActiveStaff: () => {}, clearActiveStaff: () => {} } as Ctx;
  }
  return ctx;
}
