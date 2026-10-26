/* eslint-disable no-console */
/**
 * Screenshot capture utility for Playwright.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.api.json scripts/captureScreenshot.ts --path /home --output screenshots/home.png
 *
 * Flags:
 *   --path, -p: Relative route (e.g. /home, /settings) or full URL (default: /home)
 *   --output, -o: Target file path (default: .playwright/screenshots/screenshot.png)
 *   --full-page: Capture full scrollable page (default: true)
 *   --no-auth: Skip loading authenticated storageState
 *   --width: Viewport width (default: 1280)
 *   --height: Viewport height (default: 800)
 */
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { chromium } from "playwright";

import { AUTH_STATE_PATH, login } from "./agentLogin";

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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let route = "/home";
  let output = resolve(
    import.meta.dirname,
    "../.playwright/screenshots/screenshot.png",
  );
  let useAuth = true;
  let fullPage = true;
  let width = 1280;
  let height = 800;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--path" || args[i] === "-p") {
      route = args[++i];
    } else if (args[i] === "--output" || args[i] === "-o") {
      output = resolve(process.cwd(), args[++i]);
    } else if (args[i] === "--no-auth") {
      useAuth = false;
    } else if (args[i] === "--no-full-page") {
      fullPage = false;
    } else if (args[i] === "--width") {
      width = parseInt(args[++i], 10);
    } else if (args[i] === "--height") {
      height = parseInt(args[++i], 10);
    }
  }

  const baseUrl = process.env.VITE_CURIO_URL || "http://localhost:3000";
  const targetUrl = route.startsWith("http") ? route : `${baseUrl}${route}`;

  const browser = await chromium.launch();
  let context;

  if (useAuth) {
    if (!existsSync(AUTH_STATE_PATH)) {
      console.log("Auth state not found, logging in first...");
      const loginPage = await browser.newPage();
      await login(loginPage);
      mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true });
      await loginPage.context().storageState({ path: AUTH_STATE_PATH });
      await loginPage.close();
    }
    context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
      viewport: { width, height },
    });
  } else {
    context = await browser.newContext({
      viewport: { width, height },
    });
  }

  const page = await context.newPage();
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });

  // Dismiss walkthrough welcome modal if present
  try {
    const skipButton = page.getByRole("button", { name: "Skip intro" });
    if (await skipButton.isVisible({ timeout: 1500 })) {
      console.log("Dismissing walkthrough welcome modal...");
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // Modal not present
  }

  // Clean up any lingering Joyride elements so screenshots are never obstructed
  await page.evaluate(() => {
    document
      .querySelectorAll(".react-joyride__overlay, .react-joyride__tooltip")
      .forEach((el) => el.remove());
  });

  mkdirSync(dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage });
  console.log(`Screenshot saved to ${output}`);

  await browser.close();
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
