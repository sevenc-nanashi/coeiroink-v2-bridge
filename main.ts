import { dirname } from "std/path/mod.ts";
import { Hono } from "hono/mod.ts";
import { logger as honoLogger } from "hono/middleware.ts";
import ky from "ky";
import { parse } from "std/flags/mod.ts";
import { serve } from "std/http/server.ts";
import dictProvider from "./providers/dict.ts";
import infoProvider from "./providers/info.ts";
import noopProvider from "./providers/noop.ts";
import synthesisProvider from "./providers/synthesis.ts";
import { saveStore, store } from "./store.ts";

const args = parse(Deno.args, {
  string: ["host", "port", "originalUrl"],
  default: {
    host: "127.0.0.1",
    port: "50132",
    originalUrl: "http://127.0.0.1:50032",
  },
});
const baseClient = ky.create({
  prefixUrl: args.originalUrl,
});

if (store.enginePath != undefined) {
  if (await baseClient.get("").catch(() => null)) {
    console.log("The server is already running, not starting the engine.");
  } else if (Deno.stat(store.enginePath).catch(() => null) == undefined) {
    console.log(
      `The engine path ${store.enginePath} does not exist, not starting the engine.`,
    );
    store.enginePath = undefined;
  } else {
    console.log(`Starting the engine at ${store.enginePath}...`);
    const process = new Deno.Command(
      store.enginePath,
      {
        stdout: "inherit",
        stderr: "inherit",
      },
    ).spawn();
    self.addEventListener("unload", () => {
      process.kill();
    });
  }
} else {
  console.log("No engine path, not starting the engine.");
}

while (true) {
  try {
    await baseClient.get("");
    break;
  } catch {
    console.log("Waiting for the server to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

const speakers: {
  speakerUuid: string;
}[] = await baseClient.get("v1/speakers").json();
const path: {
  speakerFolderPath: string;
} = await baseClient.get("v1/speaker_folder_path", {
  searchParams: {
    speakerUuid: speakers[0].speakerUuid,
  },
}).json();
const speakerFolderPath = path.speakerFolderPath;
const enginePath = dirname(dirname(speakerFolderPath)) + "/engine/engine.exe";

console.log(`Engine path: ${enginePath}`);

store.enginePath = enginePath;
await saveStore();

const app = new Hono();

app.use("*", honoLogger());

app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Headers", "*");
  c.res.headers.set("Access-Control-Allow-Methods", "*");
});
app.options("*", (c) => {
  return c.text("", 200);
});

[infoProvider, noopProvider, synthesisProvider, dictProvider].forEach((
  provider,
) => provider({ baseClient, app }));

serve(app.fetch, { hostname: args.host, port: parseInt(args.port) });
