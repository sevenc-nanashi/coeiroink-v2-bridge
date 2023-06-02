import { homeDir } from "./deps.ts";

const filePath = homeDir + "/.coeiroink-v2-bridge-map.json"
export const speakerMap: [number, [string, number]][] = JSON.parse(
  await Deno.readTextFile(filePath).catch(() => "[]")
);

export const getSpeakerFromId = (id: number) => {
  return speakerMap.find(([id_, _]) => id_ === id)?.[1];
};

export const getIdFromSpeaker = (speakerUuid: string, styleId: number) => {
  return speakerMap.find(
    ([_, [speakerUuid_, styleId_]]) =>
      speakerUuid_ === speakerUuid && styleId_ === styleId
  )?.[0];
};

export const getOrAppendSpeaker = async (
  speakerUuid: string,
  styleId: number
) => {
  const speakerId = getIdFromSpeaker(speakerUuid, styleId);
  if (speakerId !== undefined) {
    return speakerId;
  }
  const speakerCount = speakerMap.length;
  speakerMap.push([speakerCount, [speakerUuid, styleId]]);
  await Deno.writeTextFile(filePath, JSON.stringify(speakerMap));
  return speakerCount;
};
