import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Address } from "@/types";

async function getAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    return (data ?? []) as Address[];
  } catch {
    return [];
  }
}

export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Addresses
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Saved shipping and billing addresses for faster checkout.
      </p>

      {addresses.length === 0 ? (
        <div className="mt-8 rounded-sm border border-border-gray bg-white">
          <EmptyState
            icon={<MapPin />}
            title="No saved addresses"
            description="Addresses you save at checkout will appear here for reuse on future orders."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base capitalize">{address.type}</CardTitle>
                {address.is_default ? <Badge>Default</Badge> : null}
              </CardHeader>
              <CardContent className="text-sm text-medium-gray">
                <p className="font-medium text-dark-charcoal">
                  {address.first_name} {address.last_name}
                </p>
                {address.company ? <p>{address.company}</p> : null}
                <p>{address.line1}</p>
                {address.line2 ? <p>{address.line2}</p> : null}
                <p>
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p>{address.country}</p>
                {address.phone ? <p className="mt-2">{address.phone}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
