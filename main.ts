import { Hono, honoLogger, ky, parse, serve } from "./deps.ts";
import dictProvider from "./providers/dict.ts";
import infoProvider from "./providers/info.ts";
import noopProvider from "./providers/noop.ts";
import synthesisProvider from "./providers/synthesis.ts";

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
