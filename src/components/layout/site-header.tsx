import { UtilityBar } from "@/components/layout/utility-bar";
import { MainHeader } from "@/components/layout/main-header";
import { getIsMasterAdmin, getIsSignedIn } from "@/lib/auth/session";

/** Wraps UtilityBar + MainHeader for use in the root layout. */
export async function SiteHeader() {
  const [signedIn, isAdmin] = await Promise.all([
    getIsSignedIn(),
    getIsMasterAdmin(),
  ]);

  return (
    <>
      <UtilityBar signedIn={signedIn} />
      <MainHeader isAdmin={isAdmin} signedIn={signedIn} />
    </>
  );
}
