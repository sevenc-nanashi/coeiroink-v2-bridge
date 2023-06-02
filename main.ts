import { Hono, ky, serve } from "./deps.ts";
import infoProvider from "./providers/info.ts";
import noopProvider from "./providers/noop.ts";
import synthesisProvider from "./providers/synthesis.ts";

const baseClient = ky.create({
  prefixUrl: "http://127.0.0.1:50032",
});

const idMap = new Map<number, [string, number]>();
const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Headers", "*");
  c.res.headers.set("Access-Control-Allow-Methods", "*");
});
app.options("*", (c) => {
  return c.text("", 200);
});

[infoProvider, noopProvider, synthesisProvider].forEach((provider) =>
  provider({ baseClient, app, idMap })
);

serve(app.fetch, { port: 50132 });
