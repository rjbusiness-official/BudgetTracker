"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatCurrency as currency } from "@/src/utils/finance";
import { authorizeAmountVisibility, maskAmount } from "@/src/utils/amountPrivacy";

type AmountPrivacy = { hidden: boolean; formatCurrency: (value: number) => string; changeVisibility: (password: string) => Promise<void> };
const AmountPrivacyContext = createContext<AmountPrivacy>({ hidden: false, formatCurrency: currency, changeVisibility: async () => { throw new Error("Sign in again to change amount visibility."); } });

export function AmountPrivacyProvider({ children, userId, verifyPassword }: { children: ReactNode; userId: string; verifyPassword: (password: string) => Promise<void> }) {
  const storageKey = "budget-amounts-hidden:" + userId;
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(storageKey) === "true"; } catch { return false; } });
  const verifying = useRef(false);
  const changeVisibility = useCallback(async (password: string) => {
    if (verifying.current) throw new Error("Password verification is already in progress.");
    verifying.current = true;
    try {
      await authorizeAmountVisibility(verifyPassword, password, () => {
        const next = !hidden;
        try { localStorage.setItem(storageKey, String(next)); } catch { /* Keep this session usable if storage is unavailable. */ }
        setHidden(next);
      });
    } finally { verifying.current = false; }
  }, [hidden, storageKey, verifyPassword]);
  const value = useMemo(() => ({ hidden, changeVisibility, formatCurrency: (amount: number) => hidden ? maskAmount(amount, currency(amount)) : currency(amount) }), [hidden, changeVisibility]);
  return <AmountPrivacyContext.Provider value={value}>{children}</AmountPrivacyContext.Provider>;
}

export function useAmountPrivacy() { return useContext(AmountPrivacyContext); }
