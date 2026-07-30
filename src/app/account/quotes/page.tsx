import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Quote } from "@/types";

async function getQuotes(): Promise<Quote[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (data ?? []) as Quote[];
  } catch {
    return [];
  }
}

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
            Quotes
          </h1>
          <p className="mt-2 text-sm text-medium-gray">
            Bulk and custom quote requests submitted from your account.
          </p>
        </div>
        <Link href="/quote" className={cn(buttonVariants({ variant: "primary" }))}>
          New quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="mt-8 rounded-sm border border-border-gray bg-white">
          <EmptyState
            icon={<FileText />}
            title="No quotes yet"
            description="Request volume pricing or custom product quotes for your crew or municipality."
            action={
              <Link href="/quote" className={cn(buttonVariants({ variant: "primary" }))}>
                Request a quote
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-sm border border-border-gray bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border-gray bg-light-gray/60 text-xs uppercase tracking-wide text-medium-gray">
              <tr>
                <th className="px-4 py-3 font-medium">Quote</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-border-gray last:border-0">
                  <td className="px-4 py-3 font-medium text-dark-charcoal">
                    {quote.quote_number}
                  </td>
                  <td className="px-4 py-3 text-medium-gray">{quote.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className="capitalize">
                      {quote.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-dark-charcoal">
                    {quote.total != null ? formatCurrency(Number(quote.total)) : "Pending"}
                  </td>
                  <td className="px-4 py-3 text-medium-gray">
                    {formatDate(quote.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
