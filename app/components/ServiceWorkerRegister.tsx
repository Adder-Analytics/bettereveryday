"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) that makes the toolkit work
 * offline and satisfies the "installable app" criteria for the manifest.
 *
 * Renders nothing. Registration is deferred to `load` so it never competes with
 * the first paint, is guarded on feature support, and is wrapped so a failure is
 * silent — the site works exactly as before if the worker can't register. It runs
 * in production only: in development the hashed-asset cache-first strategy would
 * fight the dev server's hot reload, and there's nothing offline to gain locally.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline, unsupported, or blocked — the site still works online */
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
