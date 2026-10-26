/* eslint-disable no-console */
/**
 * Script to build the Android release App Bundle (AAB) or APK.
 *
 * Steps:
 * 1. Builds the web frontend (production by default, or staging).
 * 2. Syncs web assets and plugins to Android via Capacitor (npx cap sync android).
 * 3. Builds the Android App Bundle (AAB) via Gradle (bundleRelease).
 * 4. Copies the generated AAB to android/app/release/app-release.aab matching README instructions.
 *
 * Usage:
 *   npx tsx scripts/buildReleaseAndroid.ts [--mode prod|staging] [--type aab|apk] [--skip-web]
 *   npm run release:android
 */
import { spawnSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "fs";
import { resolve } from "path";

// Load .env if present
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

function runCommand(command: string, args: string[], cwd: string): void {
  console.log(`\n> [${cwd}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env },
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(
      `Command failed with exit code ${result.status}: ${command} ${args.join(" ")}`,
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let mode = "prod";
  let type = "aab";
  let skipWeb = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode" && args[i + 1]) {
      mode = args[++i];
    } else if (args[i] === "--type" && args[i + 1]) {
      type = args[++i].toLowerCase();
    } else if (args[i] === "--skip-web") {
      skipWeb = true;
    }
  }

  const appDir = resolve(import.meta.dirname, "..");
  const androidDir = resolve(appDir, "android");

  console.log("==========================================");
  console.log(
    ` Building Android Release (${type.toUpperCase()}) - Mode: ${mode}`,
  );
  console.log("==========================================");

  // 1. Build web application
  if (!skipWeb) {
    console.log(`\n[1/4] Building web frontend in ${mode} mode...`);
    runCommand("npm", ["run", "build", "--", "--mode", mode], appDir);
  } else {
    console.log("\n[1/4] Skipping web frontend build (--skip-web provided)");
  }

  // 2. Capacitor sync
  console.log("\n[2/4] Syncing web assets and plugins to Android...");
  runCommand("npx", ["cap", "sync", "android"], appDir);

  // 3. Check for Android SDK / Gradle
  console.log(`\n[3/4] Building Android ${type.toUpperCase()} with Gradle...`);
  const gradlewCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  const gradleTask = type === "apk" ? "assembleRelease" : "bundleRelease";

  try {
    runCommand(gradlewCmd, [gradleTask], androidDir);
  } catch (err) {
    if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
      console.warn(
        "\n⚠️ Note: ANDROID_HOME or ANDROID_SDK_ROOT is not set in this environment.",
      );
      console.warn(
        "To build native Android binaries directly from the CLI, install the Android SDK and export ANDROID_HOME.",
      );
    }
    console.warn(
      "Note: Android Gradle Plugin currently requires Java 17 or 21 (JDK 17/21).",
    );
    console.warn(
      "Alternatively, build and sign the app in Android Studio with: npm run cap:open:android\n",
    );
    throw err;
  }

  // 4. Locate and copy build artifact
  console.log("\n[4/4] Locating generated build artifact...");
  const releaseDir = resolve(androidDir, "app/release");
  mkdirSync(releaseDir, { recursive: true });

  if (type === "aab") {
    const candidatePaths = [
      resolve(androidDir, "app/build/outputs/bundle/release/app-release.aab"),
      resolve(
        androidDir,
        "app/build/outputs/bundle/release/app-release-unsigned.aab",
      ),
    ];

    let foundAab: string | null = null;
    for (const p of candidatePaths) {
      if (existsSync(p)) {
        foundAab = p;
        break;
      }
    }

    if (foundAab) {
      const targetAab = resolve(releaseDir, "app-release.aab");
      copyFileSync(foundAab, targetAab);
      const size = formatBytes(statSync(targetAab).size);
      console.log("\n==========================================");
      console.log(" Android App Bundle (AAB) created successfully!");
      console.log(` Artifact: ${targetAab} (${size})`);
      console.log(
        " Ready to upload to Google Play Console: https://play.google.com/console",
      );
      console.log("==========================================");
    } else {
      console.warn(
        `Warning: Gradle completed, but could not locate .aab in expected paths: ${candidatePaths.join(", ")}`,
      );
    }
  } else {
    const candidatePaths = [
      resolve(androidDir, "app/build/outputs/apk/release/app-release.apk"),
      resolve(
        androidDir,
        "app/build/outputs/apk/release/app-release-unsigned.apk",
      ),
    ];

    let foundApk: string | null = null;
    for (const p of candidatePaths) {
      if (existsSync(p)) {
        foundApk = p;
        break;
      }
    }

    if (foundApk) {
      const targetApk = resolve(releaseDir, "app-release.apk");
      copyFileSync(foundApk, targetApk);
      const size = formatBytes(statSync(targetApk).size);
      console.log("\n==========================================");
      console.log(" Android APK created successfully!");
      console.log(` Artifact: ${targetApk} (${size})`);
      console.log("==========================================");
    } else {
      console.warn(
        `Warning: Gradle completed, but could not locate .apk in expected paths: ${candidatePaths.join(", ")}`,
      );
    }
  }
}

main().catch((err) => {
  console.error("\n❌ Android release build failed:", err.message || err);
  process.exit(1);
});
