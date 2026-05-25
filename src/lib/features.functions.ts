import { createServerFn } from "@tanstack/react-start";
import type { Feature } from "@/types/cucumber";

export interface FeaturesResult {
  features: Feature[];
  error?: string;
}

export const getFeatures = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeaturesResult> => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const path = process.env.FEATURES_JSON_PATH
      ? resolve(process.env.FEATURES_JSON_PATH)
      : resolve(process.cwd(), "feature-summary.json");
    try {
      const raw = await readFile(path, "utf8");
      return { features: JSON.parse(raw) as Feature[] };
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return {
          features: [],
          error: `feature-summary.json not found at ${path}. Set FEATURES_JSON_PATH in .env to your parseFeature.js output.`,
        };
      }
      throw e;
    }
  },
);
