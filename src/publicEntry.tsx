import "./i18n/publicI18n";
import { StrictMode } from "react";
import { createRoot, type Container } from "react-dom/client";
import { PublicApp } from "./PublicApp";

export function mount(el: Container) {
  createRoot(el).render(
    <StrictMode>
      <PublicApp />
    </StrictMode>,
  );
}
