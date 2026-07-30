import { UtilityBar } from "@/components/layout/utility-bar";
import { MainHeader } from "@/components/layout/main-header";

/** Wraps UtilityBar + MainHeader for use in the root layout. */
export function SiteHeader() {
  return (
    <>
      <UtilityBar />
      <MainHeader />
    </>
  );
}
