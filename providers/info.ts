import { toBase64 } from "../deps.ts";
import { getIdFromSpeaker, getOrAppendSpeaker } from "../speakerMap.ts";
import { Provider } from "./index.ts";

let speakers: {
  speakerName: string;
  speakerUuid: string;
  base64Portrait: string;
  version: string;
  styles: {
    styleName: string;
    styleId: number;
    base64Icon: string;
    base64Portrait: string | null;
  }[];
}[];

const infoProvider: Provider = ({ baseClient, app }) => {
  app.get("/version", (c) => c.json("0.0.1"));

  app.get("/supported_devices", (c) =>
    c.json({ cpu: true, cuda: false, dml: false })
  );

  app.get("/engine_manifest", async (c) => {
    return c.json({
      manifest_version: "0.13.1",
      name: "COEIROINK v2 @ bridge",
      brand_name: "COEIROINK v2",
      uuid: "96755ba9-6c9d-4166-aaf3-86633dfa0ca5",
      url: "https://github.com/sevenc-nanashi/coeiroink-v2-bridge",
      icon: await Deno.readFile("./icon.png").then((buf) => toBase64(buf)),
      default_sampling_rate: 24000,
      terms_of_service: "https://coeiroink.com/terms を参照して下さい。",
      update_infos: [
        {
          version: "情報について",
          descriptions: [
            "VOICEVOXアプリ内ではCOEIORINKの変更履歴を表示することができません。COEIROINK側のサイトを参照して下さい。",
            "この下のアップデート内容はCOEIROINK v2 bridgeのものです。",
          ],
          contributors: [],
        },
        {
          version: "0.0.1",
          descriptions: ["初期リリース。"],
          contributors: ["sevenc-nanashi"],
        },
      ],
      dependency_licenses: [
        {
          name: "Info",
          version: "-",
          license: "Dummy",
          text: "COEIROINK v2のライセンスを確認して下さい。",
        },
      ],
      supported_features: {
        adjust_mora_pitch: false,
        adjust_phoneme_length: false,
        adjust_speed_scale: true,
        adjust_pitch_scale: true,
        adjust_intonation_scale: true,
        adjust_volume_scale: true,
        interrogative_upspeak: false,
        synthesis_morphing: false,
        manage_library: false,
      },
    });
  });

  app.get("/speakers", async (c) => {
    speakers = await baseClient.get("v1/speakers").json();

    return c.json(
      await Promise.all(
        speakers.map(async (speaker) => ({
          name: speaker.speakerName,
          speaker_uuid: speaker.speakerUuid,
          styles: await Promise.all(
            speaker.styles.map(async (style) => ({
              name: style.styleName,
              id: await getOrAppendSpeaker(speaker.speakerUuid, style.styleId),
            }))
          ),
          version: speaker.version,
        }))
      )
    );
  });

  app.get("/speaker_info", (c) => {
    const speakerUuid = c.req.query("speaker_uuid");
    const speaker = speakers.find(
      (speaker) => speaker.speakerUuid === speakerUuid
    );
    if (!speaker || !speakerUuid) {
      c.status(404);
      return c.json({ error: "speaker not found" });
    }
    return c.json({
      policy: "https://coeiroink.com/terms を参照して下さい。",
      portrait: speaker.base64Portrait,
      style_infos: speaker.styles.map((style) => ({
        id: getIdFromSpeaker(speakerUuid, style.styleId),
        icon: style.base64Icon,
        portrait: style.base64Portrait,
        voice_samples: [],
      })),
    });
  });
};

export default infoProvider;
