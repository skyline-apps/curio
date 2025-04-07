import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config";

const baseConfig = {
  test: {
    globals: true,
    clearMocks: true,
    alias: {
      "@app": resolve(__dirname),
      "@shared": resolve(__dirname, "../shared"),
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
          setupFiles: ["./vitest.setup.jsdom.tsx"],
        }),
      },
    ],
  },
});
