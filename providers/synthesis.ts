import { wav } from "../deps.ts";
import { Provider } from "./index.ts";
import { Readable } from "node:stream";
import { Buffer } from "node:buffer";
import { getSpeakerFromId } from "../speakerMap.ts";

type Prosody = {
  plain: string[];
  detail: {
    phoneme: string;
    hira: string;
    accent: number;
  }[][];
};
type Mora = {
  text: string;
  consonant: string | null;
  consonant_length: number | null;
  vowel: string;
  vowel_length: number;
  pitch: number;
};
type AccentPhrase = {
  moras: Mora[];
  accent: number;
  is_interrogative: boolean;
  pause_mora: Mora | null;
};

const prosodyToAccentPhrases = (prosody: Prosody) => {
  const result: AccentPhrase[] = [];
  for (const d of prosody.detail) {
    let accentPosition = -1;
    const moras: Mora[] = [];
    let moraIndex = -1;
    for (const m of d) {
      moraIndex++;
      if (m.hira === "、") {
        result[result.length - 1].pause_mora = {
          text: "、",
          consonant: null,
          consonant_length: null,
          vowel: "pau",
          vowel_length: 0,
          pitch: 0,
        };
      } else {
        let vowel: string, consonant: string | null;
        if (m.phoneme.includes("-")) {
          [consonant, vowel] = m.phoneme.split("-");
        } else {
          consonant = null;
          vowel = m.phoneme;
        }
        moras.push({
          text: m.hira,
          consonant,
          consonant_length: consonant ? 0 : null,
          vowel,
          vowel_length: 0,
          pitch: 0,
        });
        if (m.accent === 1) {
          accentPosition = moraIndex;
        }
      }
    }
    if (moras.length === 0) {
      continue;
    }
    result.push({
      moras,
      accent: accentPosition + 1,
      is_interrogative: false,
      pause_mora: null,
    });
  }
  return result;
};

const accentPhrasesToProsody = (accentPhrases: AccentPhrase[]) => {
  return accentPhrases.map((accentPhrase) => {
    const detail = [];
    let hasPause = false;

    accentPhrase.moras.forEach((mora, i) => {
      if (mora.text === "、") {
        hasPause = true;
      } else {
        let phoneme;
        if (mora.consonant && mora.consonant.length > 0) {
          phoneme = `${mora.consonant}-${mora.vowel}`;
        } else {
          phoneme = mora.vowel;
        }

        let accent = 0;
        if (
          i === accentPhrase.accent - 1 ||
          (i !== 0 && i <= accentPhrase.accent - 1)
        ) {
          accent = 1;
        }

        detail.push({
          hira: mora.text,
          phoneme,
          accent,
        });
      }
    });

    if (hasPause) {
      detail.push({
        hira: "、",
        phoneme: "_",
        accent: 0,
      });
    }

    return detail;
  });
};

const synthesisProvider: Provider = ({ baseClient, app }) => {
  app.post("/accent_phrases", async (c) => {
    const text = c.req.query("text");

    const prosody = await baseClient
      .post("v1/estimate_prosody", {
        json: {
          text,
        },
      })
      .json<Prosody>();
    return c.json(prosodyToAccentPhrases(prosody));
  });
  app.post("/audio_query", async (c) => {
    const text = c.req.query("text");

    const prosody = await baseClient
      .post("v1/estimate_prosody", {
        json: {
          text,
        },
      })
      .json<Prosody>();
    return c.json({
      accent_phrases: prosodyToAccentPhrases(prosody),
      speedScale: 1,
      pitchScale: 1,
      intonationScale: 1,
      volumeScale: 1,
      prePhonemeLength: 0.1,
      postPhonemeLength: 0.1,
      outputSamplingRate: 24000,
      outputStereo: true,
      kana: "",
    });
  });
  app.post("/synthesis", async (c) => {
    const audioQuery = await c.req.json();
    const speakerId = parseInt(c.req.query("speaker") ?? "");
    if (isNaN(speakerId)) {
      c.status(400);
      return c.json({
        error: "speaker is not a number",
      });
    }
    const accentPhrases = audioQuery.accent_phrases;
    const prosody = accentPhrasesToProsody(accentPhrases);
    const [speakerUuid, styleId] = getSpeakerFromId(speakerId) ?? [];
    if (!speakerUuid) {
      c.status(400);
      return c.json({
        error: "speaker not found",
      });
    }
    const body = {
      speakerUuid: speakerUuid,
      styleId: styleId,
      text: "この文章が読み上げられているのはバグです。",
      prosodyDetail: prosody,
      speedScale: audioQuery.speedScale,
      volumeScale: audioQuery.volumeScale,
      pitchScale: audioQuery.pitchScale,
      intonationScale: audioQuery.intonationScale,
      prePhonemeLength: audioQuery.prePhonemeLength,
      postPhonemeLength: audioQuery.postPhonemeLength,
      outputSamplingRate: audioQuery.outputSamplingRate * 2,
    };
    const result = await baseClient.post("v1/synthesis", {
      json: body,
    });
    if (!result.body) {
      c.status(500);
      return c.json({
        error: "synthesis failed",
      });
    }
    const parser = new wav.Reader();
    const writer = new wav.Writer({
      sampleRate: audioQuery.outputStereo
        ? audioQuery.outputSamplingRate
        : audioQuery.outputSamplingRate * 2,
      channels: audioQuery.outputStereo ? 2 : 1,
      bitDepth: 16,
    });
    // @ts-expect-error Somehow the types are wrong
    Readable.fromWeb(result.body).pipe(parser);
    parser.on("error", (err) => {
      console.error(err);
    });
    parser.pipe(writer);
    const resampled = await new Promise<Buffer>((resolve) => {
      const chunks: Buffer[] = [];
      writer.on("data", (chunk) => {
        chunks.push(chunk);
      });
      writer.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return c.body(new Uint8Array(resampled));
  });
};

export default synthesisProvider;
