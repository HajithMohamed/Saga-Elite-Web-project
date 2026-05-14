import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Suppress THREE.Clock deprecation warning from @react-three/fiber internals.
// This is a known upstream issue — fiber still references THREE.Clock which was
// deprecated in three.js r184+. Safe to remove once fiber is updated.
const _origWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
  _origWarn.apply(console, args);
};
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { Toaster } from "@/components/ui/toaster";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthDrawerProvider } from "@/components/auth-components/AuthDrawer";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const app = (
  <BrowserRouter>
    <Provider store={store}>
      <AuthDrawerProvider>
        <App />
        {/* toast popup container */}
        <Toaster />
      </AuthDrawerProvider>
    </Provider>
  </BrowserRouter>
);

// GoogleOAuthProvider requires a non-empty clientId — only mount it when the env var is set
createRoot(document.getElementById("root")).render(
  GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
  ) : (
    app
  ),
);

// Fade out the pre-React editorial loader once React has painted.
// We wait two animation frames so React has a chance to render its first DOM tree
// (which is the App's own AppLoader, visually identical to the boot loader).
const dismissBootLoader = () => {
  const boot = document.getElementById("saga-boot");
  if (!boot) return;
  boot.classList.add("is-leaving");
  // Remove from DOM after the CSS opacity transition finishes
  setTimeout(() => boot.remove(), 500);
};
requestAnimationFrame(() => requestAnimationFrame(dismissBootLoader));
