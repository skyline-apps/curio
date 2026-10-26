/* eslint-disable no-console */
/**
 * Playwright login helper for agents driving the local Curio app.
 *
 * Logs in once with TEST_USER_EMAIL/TEST_USER_PASSWORD and writes a
 * Playwright storageState file to .playwright/auth-state.json. Other
 * scripts can then open an already-authenticated context directly:
 *
 *   import { chromium } from "playwright";
 *   import { AUTH_STATE_PATH } from "./scripts/agentLogin";
 *
 *   const browser = await chromium.launch();
 *   const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
 *   const page = await context.newPage();
 *   await page.goto(process.env.VITE_CURIO_URL);
 *
 * Usage (from src/app/):
 *   npx tsx --tsconfig tsconfig.api.json scripts/agentLogin.ts
 */
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { chromium, Page } from "playwright";

for (const envPath of [
  resolve(process.cwd(), ".env"),
  resolve(import.meta.dirname, "../.env"),
  resolve(import.meta.dirname, "../../.env"),
]) {
  if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // Ignored
    }
  }
}

export const AUTH_STATE_PATH = resolve(
  import.meta.dirname,
  "../.playwright/auth-state.json",
);

export async function login(page: Page): Promise<void> {
  const appUrl = process.env.VITE_CURIO_URL || "http://localhost:3000";
  const email = process.env.TEST_USER_EMAIL || "testuser@curi.ooo";
  const password = process.env.TEST_USER_PASSWORD || "testpassword123";

  await page.goto(`${appUrl}/login`);

  // Check if already authenticated and redirected
  if (page.url().includes("/home")) {
    return;
  }

  // If password input is not visible yet, click "Sign in with password"
  const passwordToggle = page.getByText("Sign in with password", {
    exact: false,
  });
  if ((await passwordToggle.count()) > 0) {
    await passwordToggle.first().click();
  }

  // Fill email and password
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // Wait for redirect to /home
  await page.waitForURL(/\/home/, { timeout: 30000 });

  // Wait for Supabase auth token to land in localStorage
  await page.waitForFunction(
    () =>
      Object.keys(window.localStorage).some((key) =>
        key.includes("auth-token"),
      ),
    { timeout: 10000 },
  );
}

async function main(): Promise<void> {
  console.log("Launching browser for Curio login...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await login(page);
    mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true });
    await page.context().storageState({ path: AUTH_STATE_PATH });
    console.log(`Saved authenticated session to ${AUTH_STATE_PATH}`);
  } finally {
    await browser.close();
  }
}

if (import.meta.filename === process.argv[1]) {
  main().catch((err) => {
    console.error("Login failed:", err);
    process.exit(1);
  });
}
