import { Provider } from "./index.ts";

type VoicevoxWord = {
  surface: string;
  priority: number;
  context_id: number;
  part_of_speech: string;
  part_of_speech_detail_1: string;
  part_of_speech_detail_2: string;
  part_of_speech_detail_3: string;
  inflectional_type: string;
  inflectional_form: string;
  stem: string;
  yomi: string;
  pronunciation: string;
  accent_type: number;
  mora_count: number;
  accent_associative_rule: string;
};
type CoeiroinkWord = {
  word: string;
  yomi: string;
  accent: number;
  numMoras: number;
};

const dictProvider: Provider = (
  { app, baseClient },
) => {
  app.get("/user_dict", (c) => c.json([]));
  app.post("/import_user_dict", async (c) => {
    const body = await c.req.json() as Record<string, VoicevoxWord>;
    const res = await baseClient.post("v1/set_dictionary", {
      json: {
        dictionaryWords: Object.values(body).map((value) => ({
          word: value.surface,
          yomi: value.yomi,
          accent: value.accent_type,
          numMoras: value.mora_count,
        } satisfies CoeiroinkWord)),
      },
    });
    if (!res.ok) {
      return c.text(await res.text(), res.status);
    }
    return c.text("OK", 200);
  });
};

export default dictProvider;
