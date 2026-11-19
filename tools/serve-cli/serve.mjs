#!/usr/bin/env node
/**
 * Servidor estático que el contenedor ejecuta como `npx --yes serve -s .`
 * con el dist montado en el directorio de trabajo.
 *
 * `serve -s` (vercel/serve 14) inserta `{ source: "**", destination: "/index.html" }`
 * al principio de los rewrites. serve-handler aplica todas las reglas en cadena,
 * así que esa regla gana siempre y `/precios` devuelve el HTML de la home.
 * Aquí no se añade ese catch-all: los rewrites de serve.json apuntan cada ruta
 * prerenderizada a su `index.html`. Con `-s`, lo que no existe (login, panel,
 * rutas internas) responde 200 con `/index.html` para que arranque la SPA.
 */
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { resolve } from "node:path";
import { promisify } from "node:util";
import compression from "compression";
import handler from "serve-handler";

const compress = promisify(compression());

function parseArgs(argv) {
  let single = false;
  let directory = ".";
  let port = Number(process.env.PORT) || 3000;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-s" || arg === "--single") {
      single = true;
      continue;
    }
    if (arg === "-l" || arg === "--listen" || arg === "-p") {
      const value = argv[i + 1] ?? "";
      i += 1;
      const matched = /(\d+)\s*$/.exec(value);
      if (!matched) {
        console.error(`Puerto no válido: ${value}`);
        process.exit(1);
      }
      port = Number(matched[1]);
      continue;
    }
    if (arg.startsWith("-")) continue;
    directory = arg;
  }
  return { single, directory: resolve(directory), port };
}

async function loadConfig(directory) {
  try {
    const raw = await readFile(resolve(directory, "serve.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("serve.json no es un objeto");
    }
    return parsed;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function sendSpa(response, directory) {
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const file = resolve(directory, "index.html");
  const stream = createReadStream(file);
  stream.on("error", () => {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.statusCode = 404;
    response.end("Not found");
  });
  stream.pipe(response);
}

const { single, directory, port } = parseArgs(process.argv.slice(2));
const config = await loadConfig(directory);
config.public = directory;
if (config.directoryListing == null) config.directoryListing = false;

const server = http.createServer((request, response) => {
  const run = async () => {
    await compress(request, response);
    await handler(request, response, config, {
      sendError(_absolutePath, errorResponse, _acceptsJSON, _current, _handlers, _config, error) {
        const status = error?.statusCode ?? 500;
        if (single && status === 404) {
          sendSpa(errorResponse, directory);
          return;
        }
        errorResponse.statusCode = status;
        errorResponse.setHeader("Content-Type", "text/plain; charset=utf-8");
        errorResponse.end(error?.message ?? "Error");
      },
    });
  };
  run().catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      response.statusCode = 500;
      response.end("Error");
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Accepting connections at http://127.0.0.1:${port}`);
});
