import { homeDir } from "./deps.ts";

type SpeakerMap = [number, [string, number]][];
type Store = {
  speakerMap: SpeakerMap;
  enginePath: string | undefined;
};

const filePath = homeDir + "/.coeiroink-v2.json";
export let store: Store = { speakerMap: [], enginePath: undefined };
const oldFilePath = homeDir + "/.coeiroink-v2-bridge-map.json";
if (await Deno.stat(oldFilePath).catch(() => null)) {
  console.log("Migrating old speaker map...");
  store.speakerMap.push(...JSON.parse(await Deno.readTextFile(oldFilePath)));
  await Deno.remove(oldFilePath);
}
if (await Deno.stat(filePath).catch(() => null)) {
  console.log("Loading store...");
  store = JSON.parse(await Deno.readTextFile(filePath));
}

export const getSpeakerFromId = (id: number) => {
  return store.speakerMap.find(([id_, _]) => id_ === id)?.[1];
};

export const getIdFromSpeaker = (speakerUuid: string, styleId: number) => {
  return store.speakerMap.find(
    ([_, [speakerUuid_, styleId_]]) =>
      speakerUuid_ === speakerUuid && styleId_ === styleId,
  )?.[0];
};

export const getOrAppendSpeaker = async (
  speakerUuid: string,
  styleId: number,
) => {
  const speakerId = getIdFromSpeaker(speakerUuid, styleId);
  if (speakerId !== undefined) {
    return speakerId;
  }
  const speakerCount = store.speakerMap.length;
  store.speakerMap.push([speakerCount, [speakerUuid, styleId]]);
  await saveStore();
  return speakerCount;
};

export const saveStore = async () => {
  await Deno.writeTextFile(filePath, JSON.stringify(store));
};
