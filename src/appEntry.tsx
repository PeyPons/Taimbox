import "./i18n/config";
import { StrictMode } from "react";
import { createRoot, type Container } from "react-dom/client";
import App from "./App";

export function mount(el: Container) {
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
