import "./index.css";
import { installVitePreloadErrorHandler } from "@/lib/chunkReload";
import { isMarketingPath } from "@/boot/isMarketingPath";

installVitePreloadErrorHandler();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const boot = isMarketingPath(window.location.pathname)
  ? import("./publicEntry")
  : import("./appEntry");

void boot.then((mod) => mod.mount(root));
