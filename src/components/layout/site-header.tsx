import { UtilityBar } from "@/components/layout/utility-bar";
import { MainHeader } from "@/components/layout/main-header";
import { getIsSignedIn } from "@/lib/auth/session";

/** Wraps UtilityBar + MainHeader for use in the root layout. */
export async function SiteHeader() {
  const signedIn = await getIsSignedIn();

  return (
    <>
      <UtilityBar signedIn={signedIn} />
      <MainHeader />
    </>
  );
}
