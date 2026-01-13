import osPaths from "os_paths";
const homeDir = osPaths.home();

type Store = {
  enginePath: string | undefined;
};

const filePath = homeDir + "/.coeiroink-v2.json";
export let store: Store = { enginePath: undefined };

if (await Deno.stat(filePath).catch(() => null)) {
  console.log("Loading store...");
  store = JSON.parse(await Deno.readTextFile(filePath));
}
export const saveStore = async () => {
  await Deno.writeTextFile(filePath + ".tmp", JSON.stringify(store));
  await Deno.rename(filePath + ".tmp", filePath);
};
