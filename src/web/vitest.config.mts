import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config";

const baseConfig = {
  test: {
    globals: true,
    clearMocks: true,
    alias: {
      "@": resolve(__dirname),
    },
  },
};

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    workspace: [
      {
        ...baseConfig,
        test: mergeConfig(baseConfig.test, {
          name: "jsdom",
          include: ["**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.jsdom.ts"],
        }),
      },
      {
        ...baseConfig,
        test: mergeConfig(baseConfig.test, {
          name: "node",
          include: ["**/*.test.ts"],
          environment: "node",
          setupFiles: ["./vitest.setup.api.ts"],
        }),
      },
    ],
  },
});
