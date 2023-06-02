import { Hono, ky } from "../deps.ts";

export type Provider = (
  { baseClient, app, idMap }: {
    baseClient: typeof ky;
    app: Hono;
    idMap: Map<number, [string, number]>;
  },
) => void;
