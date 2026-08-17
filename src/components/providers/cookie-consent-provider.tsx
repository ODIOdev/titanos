"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  ready: boolean;
  showBanner: boolean;
  accept: () => void;
  decline: () => void;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setReady(true);
  }, []);

  const accept = useCallback(() => {
    writeCookieConsent("accepted");
    setConsent("accepted");
    setPrefsOpen(false);
  }, []);

  const decline = useCallback(() => {
    writeCookieConsent("declined");
    setConsent("declined");
    setPrefsOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setPrefsOpen(true);
  }, []);

  const showBanner = ready && (consent === null || prefsOpen);

  const value = useMemo(
    () => ({
      consent,
      ready,
      showBanner,
      accept,
      decline,
      openPreferences,
    }),
    [consent, ready, showBanner, accept, decline, openPreferences],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {consent === "accepted" ? <Analytics /> : null}
    </CookieConsentContext.Provider>
  );
}
