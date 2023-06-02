import { Hono, ky } from "../deps.ts";

export type Provider = ({
  baseClient,
  app,
}: {
  baseClient: typeof ky;
  app: Hono;
}) => void;
