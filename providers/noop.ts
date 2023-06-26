import { Provider } from "./index.ts";

const noopProvider: Provider = (
  { app },
) => {
  app.post("/initialize_speaker", (c) => c.json(true));
  app.get("/is_initialized_speaker", (c) => c.json(true));

  app.post("/mora_data", async (c) => c.json(await c.req.json()));
};

export default noopProvider;
