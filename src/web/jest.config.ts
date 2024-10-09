/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

const customConfig: Config = {
  clearMocks: true,
  moduleNameMapper: {
    "^.+\\.(svg)$": "<rootDir>/__mocks__/svg.ts",
    "\\./db$": "<rootDir>/__mocks__/db.ts",
    "\\./utils/logger$": "<rootDir>/__mocks__/logger.ts",
    "\\./utils/supabase/client$": "<rootDir>/__mocks__/supabase-client.ts",
    "\\./utils/supabase/server$": "<rootDir>/__mocks__/supabase-server.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

// Separate into two different projects, one for jsdom (React) tests and one for node.
// We have to do some fancy stuff here wrapping both configs in createJestConfig.
const jestConfig = async (): Promise<Config> => {
  const jsdomConfig = await createJestConfig({
    ...customConfig,
    displayName: "jsdom",
    testMatch: ["<rootDir>/**/*.test.tsx"],
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [
      ...(customConfig.setupFilesAfterEnv || []),
      "<rootDir>/jest.setup.jsdom.ts",
    ],
  })();

  const nodeConfig = await createJestConfig({
    ...customConfig,
    displayName: "node",
    testMatch: ["<rootDir>/**/*.test.ts"],
    testEnvironment: "node",
  })();

  return {
    ...customConfig,
    projects: [jsdomConfig, nodeConfig],
  };
};

export default jestConfig;
