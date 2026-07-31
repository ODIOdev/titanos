/** Keep digits only; drop a leading US country code 1 when 11 digits. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** Format as (555) 555-5555 while typing. */
export function formatPhoneInput(value: string): string {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidUsPhone(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return phoneDigits(value).length === 10;
}
