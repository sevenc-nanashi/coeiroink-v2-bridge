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

const infoProvider: Provider = ({ baseClient, app, idMap }) => {
  app.get("/version", (c) => c.json("0.0.1"));

  app.get("/supported_devices", (c) =>
    c.json({ cpu: true, cuda: false, dml: false })
  );

  app.get("/engine_manifest", async (c) => {
    return c.json({
      manifest_version: "0.13.1",
      name: "COEIROINK v2 @ bridge",
      brand_name: "COEIROINK v2",
      uuid: "2576c6a0-1b0e-4b1e-9b0c-5b0b6b4b7b7b",
      url: "https://github.com/sevenc-nanashi/coeiroink-v2-bridge",
      icon: await Deno.readFile("./icon.png").then((buf) =>
        btoa(String.fromCharCode(...buf))
      ),
      default_sampling_rate: 24000,
      terms_of_service: "https://coeiroink.com/terms を参照して下さい。",
      update_infos: [
        {
          version: "Info",
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
    let i = -1;
    for (const speaker of speakers) {
      for (const style of speaker.styles) {
        i++;
        idMap.set(i, [speaker.speakerUuid, style.styleId]);
      }
    }
    return c.json(
      speakers.map((speaker) => ({
        name: speaker.speakerName,
        speaker_uuid: speaker.speakerUuid,
        styles: speaker.styles.map((style) => ({
          name: style.styleName,
          id: [...idMap.entries()].find(
            ([_, [uuid, id]]) =>
              uuid === speaker.speakerUuid && id === style.styleId
          )![0],
        })),
        version: speaker.version,
      }))
    );
  });

  app.get("/speaker_info", (c) => {
    const speakerUuid = c.req.query("speaker_uuid");
    const speaker = speakers.find(
      (speaker) => speaker.speakerUuid === speakerUuid
    );
    if (!speaker) {
      c.status(404);
      return c.json({ error: "speaker not found" });
    }
    return c.json({
      policy: "https://coeiroink.com/terms を参照して下さい。",
      portrait: speaker.base64Portrait,
      style_infos: speaker.styles.map((style) => ({
        id: [...idMap.entries()].find(
          ([_, [uuid, id]]) => uuid === speakerUuid && id === style.styleId
        )![0],
        icon: style.base64Icon,
        portrait: style.base64Portrait,
        voice_samples: [],
      })),
    });
  });
};

export default infoProvider;
