import { UtilityBar } from "@/components/layout/utility-bar";
import { MainHeader } from "@/components/layout/main-header";
import { getIsMasterAdmin, getIsSignedIn } from "@/lib/auth/session";
import { getFreeShippingThreshold } from "@/lib/data/free-shipping";

/** Wraps UtilityBar + MainHeader for use in the root layout. */
export async function SiteHeader() {
  const [signedIn, isAdmin, freeShippingThreshold] = await Promise.all([
    getIsSignedIn(),
    getIsMasterAdmin(),
    getFreeShippingThreshold(),
  ]);

  return (
    <>
      <UtilityBar
        signedIn={signedIn}
        freeShippingThreshold={freeShippingThreshold}
      />
      <MainHeader isAdmin={isAdmin} signedIn={signedIn} />
    </>
  );
}
