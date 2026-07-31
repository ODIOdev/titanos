"use client";

import * as React from "react";
import { BrandLoader } from "@/components/layout/brand-loader";

/** Keeps the splash on screen long enough to read, even on instant loads. */
const MIN_VISIBLE_MS = 600;
/** Hard cap so a slow asset never traps the visitor behind the splash. */
const MAX_VISIBLE_MS = 3000;
const FADE_MS = 400;

export function SitePreloader() {
  const [removed, setRemoved] = React.useState(false);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    const mountedAt = Date.now();
    const timers: number[] = [];

    function dismiss() {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mountedAt));
      timers.push(
        window.setTimeout(() => {
          setFading(true);
          timers.push(window.setTimeout(() => setRemoved(true), FADE_MS));
        }, remaining),
      );
    }

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
    }
    timers.push(window.setTimeout(dismiss, MAX_VISIBLE_MS));

    return () => {
      window.removeEventListener("load", dismiss);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (removed) return null;

  return (
    <>
      <noscript>
        <style>{`#site-preloader{display:none}`}</style>
      </noscript>
      <div
        id="site-preloader"
        className="animate-preloader-failsafe fixed inset-0 z-9999 flex items-center justify-center bg-near-black"
        style={
          fading
            ? { animation: `titan-preloader-out ${FADE_MS}ms ease-out forwards` }
            : undefined
        }
      >
        <BrandLoader tone="dark" label="Loading" />
      </div>
    </>
  );
}
