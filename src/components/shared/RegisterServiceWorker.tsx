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

    // By the time this effect runs (after hydration), the window "load"
    // event has almost always already fired, so listening for it here
    // would mean register() never runs. Register immediately if the page
    // is already fully loaded, and only fall back to the event listener
    // for the rare case this effect runs before load.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
