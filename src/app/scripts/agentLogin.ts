/* eslint-disable no-console */
/**
 * Playwright login helper for agents driving the local Curio app.
 *
 * Logs in with TEST_USER_EMAIL/TEST_USER_PASSWORD via Supabase Auth
 * and writes a Playwright storageState file to .playwright/auth-state.json.
 * Other scripts can then open an already-authenticated context directly:
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
 *   npm run auth:login
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
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "http://localhost:8000";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error(
      "VITE_SUPABASE_ANON_KEY is not defined in environment variables",
    );
  }

  // Navigate to app origin first so localStorage and cookies are scoped properly
  await page.goto(appUrl);

  await page.evaluate(
    async ({ email, password, appUrl, supabaseUrl, anonKey }) => {
      // 1. Authenticate with Supabase Auth API
      const res = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error_description || data.msg || "Authentication failed",
        );
      }

      // 2. Set Supabase auth token in localStorage
      let projectRef = "localhost";
      try {
        const hostname = new URL(supabaseUrl).hostname;
        projectRef = hostname.split(".")[0] || "localhost";
      } catch {
        // Ignored
      }
      const storageKey = `sb-${projectRef}-auth-token`;
      window.localStorage.setItem(storageKey, JSON.stringify(data));

      // 3. Set server-side session cookie via /api/auth/session
      const sessionRes = await fetch(`${appUrl}/api/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }),
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to set backend session");
      }

      // 4. Mark walkthrough completed so welcome modal does not block screenshots
      try {
        await fetch(`${appUrl}/api/v1/user/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.access_token}`,
          },
          body: JSON.stringify({ completedWalkthrough: true }),
        });
      } catch {
        // Ignored
      }
    },
    { email, password, appUrl, supabaseUrl, anonKey },
  );

  // Navigate to /home to confirm the session is active
  await page.goto(`${appUrl}/home`);
  await page.waitForURL(/\/home/, { timeout: 30000 });
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
