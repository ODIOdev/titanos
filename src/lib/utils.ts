import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Date + time for admin order timestamps (e.g. Recent orders). */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PRODUCTION_SITE_URL = "https://www.titansafetystore.com";

export function absoluteUrl(path = ""): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const host = configured.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase() ?? "";
  const staleProductionHost =
    process.env.VERCEL_ENV === "production" &&
    (!host || host.includes("localhost") || host.endsWith(".vercel.app"));
  const base = staleProductionHost
    ? PRODUCTION_SITE_URL
    : configured || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getFreeShippingRemaining(subtotal: number, threshold: number): number {
  return Math.max(0, threshold - subtotal);
}

export function clampQuantity(quantity: number, max: number): number {
  return Math.min(Math.max(1, quantity), Math.max(1, max));
}

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TSC-${stamp}-${rand}`;
}

export function generateQuoteNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QT-${stamp}-${rand}`;
}

/** Accepts Titan roles (`admin`) and existing project roles (`Administrator`). */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrator";
}

/**
 * Profiles shown on /admin/customers — non-admin / non-staff accounts.
 * Matches empty role + `customer` (and other storefront roles), excludes CRM staff.
 */
export function isCustomerProfile(profile: {
  role?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  const role = String(profile.role ?? "").toLowerCase();
  if (!role || role === "customer") return true;
  if (isAdminRole(profile.role)) return false;
  if (role === "support" || role === "staff") return false;
  return true;
}

export type CatalogStatus = "active" | "draft" | "archived";

/** Canonical master admin email for Titan CRM at /admin. */
export const MASTER_ADMIN_EMAIL = "admin@gmail.com";

export function getCatalogStatus(product: {
  active: boolean;
  metadata?: Record<string, unknown> | null;
}): CatalogStatus {
  if (product.active) return "active";
  const raw = product.metadata?.status;
  if (raw === "draft") return "draft";
  return "archived";
}

export function catalogStatusToFlags(status: CatalogStatus): {
  active: boolean;
  metadataStatus: CatalogStatus;
} {
  return {
    active: status === "active",
    metadataStatus: status,
  };
}

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === MASTER_ADMIN_EMAIL;
}

/**
 * Master admin → Titan /admin CRM only (products, inventory, profits).
 * Customers → /account only. Never swap these.
 */
export function isMasterAdmin(profile: {
  role?: string | null;
  is_owner?: boolean | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  if (isMasterAdminEmail(profile.email)) return true;
  if (profile.is_owner === true && isAdminRole(profile.role)) return true;
  return false;
}
