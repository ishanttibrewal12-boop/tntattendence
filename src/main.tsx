import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Guard: unregister service workers in preview/iframe contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

// Self-heal: when a stale chunk fails to import (e.g. after a redeploy
// invalidates Vite's optimized dep hashes), clear caches + SWs and hard-
// reload exactly once. Without this guard the page shows a blank screen.
const RELOAD_FLAG = "__chunk_reload_attempted";

const isStaleChunkError = (msg: string) =>
  /Importing a module script failed/i.test(msg) ||
  /Failed to fetch dynamically imported module/i.test(msg) ||
  /ChunkLoadError/i.test(msg) ||
  /Loading chunk \d+ failed/i.test(msg);

const recoverFromStaleChunk = async () => {
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set("__r", String(Date.now()));
    window.location.replace(url.toString());
  }
};

window.addEventListener("error", (e) => {
  const msg = e?.message || String(e?.error || "");
  if (isStaleChunkError(msg)) recoverFromStaleChunk();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e?.reason && (e.reason.message || e.reason)) || "");
  if (isStaleChunkError(msg)) recoverFromStaleChunk();
});

// Clear the flag on a successful boot so future stale errors can recover.
window.addEventListener("load", () => {
  setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 5000);
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
