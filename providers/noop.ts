import { Provider } from "./index.ts";

const noopProvider: Provider = (
  { app },
) => {
  app.get("/user_dict", (c) => c.json([]));
  app.post("/import_user_dict", (c) => c.json([]));

  app.post("/initialize_speaker", (c) => c.json(true));
  app.get("/is_initialized_speaker", (c) => c.json(true));
};

export default noopProvider;
