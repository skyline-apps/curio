import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config";

const baseConfig = {
  test: {
    globals: true,
    clearMocks: true,
    alias: {
      "@api": resolve(__dirname),
      "@shared": resolve(__dirname, "../shared"),
    },
  },
};

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    workspace: [
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
