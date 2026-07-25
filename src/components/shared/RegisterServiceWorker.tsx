"use client";

import { useEffect } from "react";

// Registers the service worker once the page has loaded. This is what
// makes Chrome/Android actually offer the "Install app" / add-to-home-screen
// prompt automatically, on top of the manifest.json + icons already set up
// in the root layout. Safe no-op in browsers without SW support or during
// local http (non-TLS) dev on some setups.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability just degrades gracefully — no user-facing error needed.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
