export const COOKIE_CONSENT_NAME = "titan_cookie_consent";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieConsent = "accepted" | "declined";

function isConsent(value: string | null | undefined): value is CookieConsent {
  return value === "accepted" || value === "declined";
}

export function parseCookieConsent(value: string | null | undefined): CookieConsent | null {
  return isConsent(value) ? value : null;
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${COOKIE_CONSENT_NAME}=`));
  return parseCookieConsent(match?.slice(COOKIE_CONSENT_NAME.length + 1));
}

export function writeCookieConsent(value: CookieConsent) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}
