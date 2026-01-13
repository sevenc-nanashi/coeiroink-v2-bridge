import { Hono } from "hono/mod.ts";
import ky from "ky";

export type Provider = ({
  baseClient,
  app,
}: {
  baseClient: typeof ky;
  app: Hono;
}) => void;
