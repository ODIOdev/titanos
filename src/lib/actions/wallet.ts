"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createWalletManualEntry,
  emptyWalletJournal,
  parseWalletJournal,
  WALLET_JOURNAL_KEY,
  type WalletDirection,
  type WalletJournal,
  type WalletManualEntry,
} from "@/lib/admin/wallet";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export type WalletActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; result: WalletActionResult<WalletJournal> }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      result: { success: false, message: "Supabase is not configured." },
    };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        result: { success: false, message: "Sign in required." },
      };
    }
    if (isMasterAdminEmail(user.email)) {
      return { ok: true, userId: user.id };
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();
    if (!isMasterAdmin(profile)) {
      return {
        ok: false,
        result: {
          success: false,
          message: "Master admin access required.",
        },
      };
    }
    return { ok: true, userId: user.id };
  } catch {
    return {
      ok: false,
      result: { success: false, message: "Unable to verify admin access." },
    };
  }
}

async function readJournal(): Promise<WalletJournal> {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", WALLET_JOURNAL_KEY)
    .maybeSingle();
  return parseWalletJournal(data?.value);
}

async function writeJournal(journal: WalletJournal): Promise<void> {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: WALLET_JOURNAL_KEY,
      value: journal as unknown as import("@/types/database").Json,
    },
    { onConflict: "key" },
  );
  if (error) throw error;
  revalidatePath("/admin/wallet");
  revalidatePath("/admin/supplier");
  revalidatePath("/admin");
}

export async function getWalletJournal(): Promise<WalletJournal> {
  if (!isSupabaseConfigured()) return emptyWalletJournal();
  try {
    return await readJournal();
  } catch {
    return emptyWalletJournal();
  }
}

export async function addWalletJournalEntry(input: {
  date?: string;
  direction: WalletDirection;
  category: WalletManualEntry["category"];
  amount: number;
  note?: string;
}): Promise<WalletActionResult<WalletJournal>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const amount = Math.round(Math.max(0, Number(input.amount) || 0) * 100) / 100;
  if (amount <= 0) {
    return { success: false, message: "Enter an amount greater than zero." };
  }

  try {
    const journal = await readJournal();
    const entry = createWalletManualEntry({
      date: input.date,
      direction: input.direction,
      category: input.category,
      amount,
      note: input.note,
    });
    journal.entries.unshift(entry);
    await writeJournal(journal);
    return {
      success: true,
      message: "Journal entry added.",
      data: journal,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to save journal entry.",
    };
  }
}

export async function deleteWalletJournalEntry(
  id: string,
): Promise<WalletActionResult<WalletJournal>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const journal = await readJournal();
    const next = journal.entries.filter((e) => e.id !== id);
    if (next.length === journal.entries.length) {
      return { success: false, message: "Entry not found." };
    }
    journal.entries = next;
    await writeJournal(journal);
    return {
      success: true,
      message: "Entry removed.",
      data: journal,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to remove journal entry.",
    };
  }
}

/** Simulated Stripe top-up — credits wallet balance (manual income). */
export async function simulateWalletDeposit(input: {
  amount: number;
}): Promise<WalletActionResult<WalletJournal>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const amount = Math.round(Math.max(0, Number(input.amount) || 0) * 100) / 100;
  if (amount <= 0) {
    return { success: false, message: "Enter an amount greater than zero." };
  }

  try {
    const journal = await readJournal();
    const entry = createWalletManualEntry({
      direction: "credit",
      category: "manual_income",
      amount,
      note: `Stripe simulated deposit · $${amount.toFixed(2)}`,
    });
    journal.entries.unshift(entry);
    await writeJournal(journal);
    return {
      success: true,
      message: `Deposited ${amount.toFixed(2)} to wallet balance.`,
      data: journal,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to record deposit.",
    };
  }
}

/** Best-effort bookkeeping when supplies are purchased with a known cost. */
export async function recordSuppliesPurchase(input: {
  name: string;
  qty: number;
  totalCost: number;
}): Promise<void> {
  const totalCost =
    Math.round(Math.max(0, Number(input.totalCost) || 0) * 100) / 100;
  const qty = Math.floor(Number(input.qty) || 0);
  if (totalCost <= 0 || qty <= 0) return;
  if (!isSupabaseConfigured()) return;

  try {
    const journal = await readJournal();
    journal.entries.unshift(
      createWalletManualEntry({
        direction: "debit",
        category: "supplies_purchase",
        amount: totalCost,
        note: `Supplies · ${input.name} × ${qty}`,
      }),
    );
    await writeJournal(journal);
  } catch {
    // Non-blocking — inventory save already succeeded.
  }
}

/** Cash out when buying product stock from a supplier. */
export async function recordProductPurchase(input: {
  name: string;
  qty: number;
  totalCost: number;
  sku?: string | null;
  productId?: string;
}): Promise<void> {
  const totalCost =
    Math.round(Math.max(0, Number(input.totalCost) || 0) * 100) / 100;
  const qty = Math.floor(Number(input.qty) || 0);
  if (totalCost <= 0 || qty <= 0) return;
  if (!isSupabaseConfigured()) return;

  const sku = input.sku?.trim() || "";
  const note = sku
    ? `Supplier · ${input.name} × ${qty} · SKU ${sku}`
    : `Supplier · ${input.name} × ${qty}`;

  try {
    const journal = await readJournal();
    journal.entries.unshift(
      createWalletManualEntry({
        direction: "debit",
        category: "product_purchase",
        amount: totalCost,
        note,
      }),
    );
    await writeJournal(journal);
  } catch {
    // Non-blocking
  }
}
