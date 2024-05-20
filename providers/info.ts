import { dirname, toBase64 } from "../deps.ts";
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
  app.get("/version", async (c) => {
    await baseClient.get("");

    return c.json("0.2.1");
  });

  app.get(
    "/supported_devices",
    (c) => c.json({ cpu: true, cuda: false, dml: false }),
  );

  app.get("/engine_manifest", async (c) => {
    return c.json({
      manifest_version: "0.13.1",
      name: "COEIROINK v2 @ bridge",
      brand_name: "COEIROINK v2",
      uuid: "96755ba9-6c9d-4166-aaf3-86633dfa0ca5",
      url: "https://github.com/sevenc-nanashi/coeiroink-v2-bridge",
      icon: await Deno.readFile(
        Deno.execPath().endsWith("deno.exe")
          ? new URL("./icon.png", import.meta.url)
          : dirname(Deno.execPath()) + "/icon.png",
      ).then(
        (buf) => toBase64(buf),
      ),
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
          version: "0.2.1",
          descriptions: [
            "Fix: 空のAccentPhraseで無音を返すように",
          ],
          contributors: ["sevenc-nanashi"],
        },
        {
          version: "0.2.0",
          descriptions: [
            "Change: Coeiroink側のstyleIdを使うように変更",
          ],
          contributors: ["sevenc-nanashi"],
        },
        {
          version: "0.1.3",
          descriptions: [
            "Fix: 読点周りの挙動を修正",
          ],
          contributors: ["sevenc-nanashi"],
        },
        {
          version: "0.1.2",
          descriptions: [
            "Add: mutexを追加",
            "Add: 自動起動を追加",
          ],
          contributors: ["sevenc-nanashi"],
        },
        {
          version: "0.1.1",
          descriptions: [
            "Add: Mac版ビルドを追加",
            "Fix: ユーザー辞書周りを修正",
          ],
          contributors: ["sevenc-nanashi"],
        },
        {
          version: "0.1.0",
          descriptions: [
            "Update: COEIROINK v2正式版に追従",
            "Add: 辞書読み込みを追加",
            "Delete: outputSamplingRate周りのワークアラウンドを削除",
            "Fix: pitchScaleをデフォルトで0に（by @itsuka-dev）",
          ],
          contributors: ["sevenc-nanashi", "itsuka-dev"],
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
      speakers.map((speaker) => ({
        name: speaker.speakerName,
        speaker_uuid: speaker.speakerUuid,
        styles: speaker.styles.map((style) => ({
          name: style.styleName,
          id: style.styleId,
        })),
        version: speaker.version,
      })),
    );
  });

  app.get("/speaker_info", (c) => {
    const speakerUuid = c.req.query("speaker_uuid");
    const speaker = speakers.find(
      (speaker) => speaker.speakerUuid === speakerUuid,
    );
    if (!speaker || !speakerUuid) {
      c.status(404);
      return c.json({ error: "speaker not found" });
    }
    return c.json({
      policy: "https://coeiroink.com/terms を参照して下さい。",
      portrait: speaker.base64Portrait,
      style_infos: speaker.styles.map((style) => ({
        id: style.styleId,
        icon: style.base64Icon,
        portrait: style.base64Portrait,
        voice_samples: [],
      })),
    });
  });
};

export default infoProvider;
