/**
 * Launcher para selfhosted-supabase-mcp en Cursor.
 * Carga .env / .env.local del repo y opcionalmente .cursor/mcp.env (secretos MCP).
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(join(projectRoot, ".env"));
loadEnvFile(join(projectRoot, ".env.local"));
loadEnvFile(join(projectRoot, ".cursor", "mcp.env"));

const mcpRoot =
  process.env.SELFHOSTED_SUPABASE_MCP_PATH ||
  join(process.env.USERPROFILE || "", ".cursor", "mcp-servers", "selfhosted-supabase-mcp");
const entry = join(mcpRoot, "dist", "index.js");

if (!existsSync(entry)) {
  console.error(
    `[selfhosted-supabase-mcp] No se encontró ${entry}. Clona y compila:\n` +
      `  git clone https://github.com/HenkDz/selfhosted-supabase-mcp.git "${mcpRoot}"\n` +
      `  cd "${mcpRoot}" && bun install && bun run build`,
  );
  process.exit(1);
}

const bunBin =
  process.env.BUN_INSTALL
    ? join(process.env.BUN_INSTALL, "bin", "bun.exe")
    : join(process.env.USERPROFILE || "", ".bun", "bin", "bun.exe");

if (!existsSync(bunBin)) {
  console.error(
    `[selfhosted-supabase-mcp] Bun no encontrado en ${bunBin}. Instálalo: https://bun.sh`,
  );
  process.exit(1);
}

const env = {
  ...process.env,
  SUPABASE_URL:
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    "",
  DATABASE_URL: process.env.DATABASE_URL || "",
  SUPABASE_AUTH_JWT_SECRET:
    process.env.SUPABASE_AUTH_JWT_SECRET || process.env.JWT_SECRET || "",
};

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.error(
    "[selfhosted-supabase-mcp] Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY.\n" +
      "Añádelos en .env.local (VITE_SUPABASE_*) o en .cursor/mcp.env — ver .cursor/mcp.env.example",
  );
  process.exit(1);
}

const child = spawn(bunBin, ["run", entry], {
  env,
  stdio: "inherit",
  windowsHide: true,
});

child.on("error", (err) => {
  console.error("[selfhosted-supabase-mcp]", err.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
