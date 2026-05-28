import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App";
import "./index.css";
import { initDatabase } from "@/lib/db";

// Auto-reload the page when a new service worker takes control (auto-update)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

async function init() {
  await initDatabase();
  
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

init();

