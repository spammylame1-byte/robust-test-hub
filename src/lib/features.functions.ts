import { createServerFn } from "@tanstack/react-start";
import type { Feature } from "@/types/cucumber";

export const getFeatures = createServerFn({ method: "GET" }).handler(async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const path = process.env.FEATURES_JSON_PATH
    ? resolve(process.env.FEATURES_JSON_PATH)
    : resolve(process.cwd(), "feature-summary.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Feature[];
});
