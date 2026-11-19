/**
 * Deja en dist/ el ejecutable que usa el contenedor (`npx --yes serve -s .`
 * con el dist como directorio de trabajo). npx elige node_modules/.bin/serve
 * si existe, antes de descargar vercel/serve.
 */
import { cpSync, chmodSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const destModules = resolve(root, "dist/node_modules");
const runtime = ["serve-handler", "compression"];

function copyPackage(name, seen) {
  if (seen.has(name)) return;
  seen.add(name);
  const manifestPath = require.resolve(`${name}/package.json`);
  const source = dirname(manifestPath);
  cpSync(source, resolve(destModules, name), { recursive: true, dereference: true });
  const manifest = require(manifestPath);
  const dependencies = manifest.dependencies ?? {};
  for (const dependency of Object.keys(dependencies)) {
    copyPackage(dependency, seen);
  }
}

rmSync(destModules, { recursive: true, force: true });
mkdirSync(resolve(destModules, ".bin"), { recursive: true });
const seen = new Set();
for (const name of runtime) copyPackage(name, seen);

const bin = resolve(destModules, ".bin/serve");
cpSync(resolve(root, "tools/serve-cli/serve.mjs"), bin);
chmodSync(bin, 0o755);
console.log(`install-public-server: ${seen.size} paquetes en dist/node_modules`);
