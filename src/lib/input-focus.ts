import type { FocusEvent } from "react";

/** Select existing input text on focus so typing replaces it immediately. */
export function selectInputValueOnFocus(
  event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
  const el = event.currentTarget;
  // Defer so the browser finishes focusing before we select.
  requestAnimationFrame(() => {
    try {
      el.select();
    } catch {
      // Some input types (e.g. number in older browsers) may not support select().
    }
  });
}

export function shouldSelectOnFocus(
  type: string | undefined,
  inputMode?: string,
) {
  if (type === "number" || type === "tel") return true;
  if (
    inputMode === "decimal" ||
    inputMode === "numeric" ||
    inputMode === "tel"
  ) {
    return true;
  }
  return false;
}

/** True for placeholder-like zeros ("0", "0.00") — not empty. */
export function isZeroNumericDisplay(raw: string) {
  const t = raw.trim();
  if (!t) return false;
  return /^0+(\.0+)?$/.test(t);
}
