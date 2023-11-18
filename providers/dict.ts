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
type VoicevoxMinimumWord = {
  surface: string;
  pronunciation: string;
  accent_type: number;
};
type CoeiroinkWord = {
  word: string;
  yomi: string;
  accent: number;
  numMoras: number;
};

let words: Record<string, CoeiroinkWord> = {};
const moraRegex = new RegExp(
  [
    "[イ][ェ]|[ヴ][ャュョ]|[トド][ゥ]|[テデ][ィャュョ]|[デ][ェ]|[クグ][ヮ]|", // rule_others
    "[キシチニヒミリギジビピ][ェャュョ]|", // rule_line_i
    "[ツフヴ][ァ]|[ウスツフヴズ][ィ]|[ウツフヴ][ェォ]|", // rule_line_u
    "[ァ-ヴー]", // rule_one_mora
  ].join(""),
  "g",
);
const minWordToCoeiroinkWord = (word: VoicevoxMinimumWord) => {
  const moraCount = word.pronunciation.match(moraRegex)?.length ?? 0;
  return {
    word: word.surface,

    yomi: word.pronunciation,
    accent: word.accent_type,
    numMoras: moraCount,
  } satisfies CoeiroinkWord;
};

const dictProvider: Provider = (
  { app, baseClient },
) => {
  const updateDict = async () => {
    await baseClient.post("v1/set_dictionary", {
      json: {
        dictionaryWords: Object.values(words),
      },
    });
  };
  app.get("/user_dict", (c) =>
    c.json(
      words,
    ));
  app.post("/user_dict_word", async (c) => {
    const body = await c.req.json() as VoicevoxMinimumWord;
    const uuid = crypto.randomUUID();
    words[uuid] = minWordToCoeiroinkWord(body);
    await updateDict();
    return c.json(uuid);
  });
  app.put("/user_dict_word/:uuid", async (c) => {
    const uuid = c.req.param("uuid");
    const body = {
      surface: c.req.query("surface"),
      pronunciation: c.req.query("pronunciation"),
      accent_type: parseInt(c.req.query("accent_type") || "0"),
    } as VoicevoxMinimumWord;
    words[uuid] = minWordToCoeiroinkWord(body);
    await updateDict();
    c.status(204);
    return c.text("");
  });
  app.delete("/user_dict_word/:uuid", async (c) => {
    const uuid = c.req.param("uuid");
    delete words[uuid];
    await updateDict();

    c.status(204);
    return c.text("");
  });

  app.post("/import_user_dict", async (c) => {
    const body = await c.req.json() as Record<string, VoicevoxWord>;
    words = Object.fromEntries(
      Object.entries(body).map(([uuid, value]) => [
        uuid,
        {
          word: value.surface,
          yomi: value.yomi,
          accent: value.accent_type,
          numMoras: value.mora_count,
        } satisfies CoeiroinkWord,
      ]),
    );
    await updateDict();
    return c.text("OK", 200);
  });
};

export default dictProvider;
