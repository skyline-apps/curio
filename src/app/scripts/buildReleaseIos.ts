/* eslint-disable no-console */
/**
 * Script to build the iOS release archive (.xcarchive) or IPA package.
 *
 * Steps:
 * 1. Builds the web frontend (production by default, or staging).
 * 2. Syncs web assets and plugins to iOS via Capacitor (npx cap sync ios).
 * 3. On macOS, creates an Xcode archive (.xcarchive) via xcodebuild.
 *    (On non-macOS environments, syncs web assets and prints macOS instructions).
 *
 * Usage:
 *   npx tsx scripts/buildReleaseIos.ts [--mode prod|staging] [--skip-web] [--export]
 *   npm run release:ios
 */
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, statSync } from "fs";
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

function isCommandAvailable(command: string): boolean {
  const checkCmd = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checkCmd, [command], { stdio: "ignore" });
  return result.status === 0;
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
  let skipWeb = false;
  let shouldExport = false;
  let exportOptionsPlist: string | null = null;
  const scheme = "App";
  const configuration = "Release";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode" && args[i + 1]) {
      mode = args[++i];
    } else if (args[i] === "--skip-web") {
      skipWeb = true;
    } else if (args[i] === "--export") {
      shouldExport = true;
    } else if (args[i] === "--export-options-plist" && args[i + 1]) {
      shouldExport = true;
      exportOptionsPlist = resolve(process.cwd(), args[++i]);
    }
  }

  const appDir = resolve(import.meta.dirname, "..");
  const iosDir = resolve(appDir, "ios/App");

  console.log("==========================================");
  console.log(` Building iOS Release - Mode: ${mode}`);
  console.log("==========================================");

  // 1. Build web application
  if (!skipWeb) {
    console.log(`\n[1/3] Building web frontend in ${mode} mode...`);
    runCommand("npm", ["run", "build", "--", "--mode", mode], appDir);
  } else {
    console.log("\n[1/3] Skipping web frontend build (--skip-web provided)");
  }

  // 2. Capacitor sync
  console.log("\n[2/3] Syncing web assets and plugins to iOS project...");
  runCommand("npx", ["cap", "sync", "ios"], appDir);

  // 3. Platform check for native compilation
  if (process.platform !== "darwin") {
    console.log("\n==========================================");
    console.log(" Web bundle & Capacitor plugins synced to iOS successfully!");
    console.log(
      " Note: Native iOS compilation (.xcarchive / .ipa) requires macOS with Xcode.",
    );
    console.log(" When working on a Mac, run:");
    console.log("   npm run release:ios       # Builds .xcarchive via CLI");
    console.log("   npm run cap:open:ios      # Opens workspace in Xcode");
    console.log("==========================================");
    return;
  }

  if (!isCommandAvailable("xcodebuild")) {
    throw new Error(
      "xcodebuild is not available in PATH. Please install Xcode and the Command Line Tools (xcode-select --install).",
    );
  }

  console.log("\n[3/3] Creating Xcode archive (.xcarchive) with xcodebuild...");
  const workspacePath = resolve(iosDir, "App.xcworkspace");
  const buildDir = resolve(iosDir, "build");
  const archivePath = resolve(buildDir, "App.xcarchive");
  mkdirSync(buildDir, { recursive: true });

  const xcodebuildArgs = [
    "-workspace",
    workspacePath,
    "-scheme",
    scheme,
    "-configuration",
    configuration,
    "-destination",
    "generic/platform=iOS",
    "-archivePath",
    archivePath,
    "archive",
  ];

  runCommand("xcodebuild", xcodebuildArgs, iosDir);

  if (!existsSync(archivePath)) {
    throw new Error(`Expected archive at ${archivePath} was not created.`);
  }

  console.log("\n==========================================");
  console.log(" iOS archive (.xcarchive) created successfully!");
  console.log(` Archive: ${archivePath}`);
  console.log(" To distribute via Xcode Organizer:");
  console.log(`   open "${archivePath}"`);
  console.log(" Select 'Distribute App' -> 'App Store Connect'.");
  console.log("==========================================");

  // Optional IPA export
  if (shouldExport) {
    const defaultPlist = resolve(iosDir, "exportOptions.plist");
    const plistToUse =
      exportOptionsPlist || (existsSync(defaultPlist) ? defaultPlist : null);

    if (plistToUse) {
      console.log(`\nExporting IPA using ${plistToUse}...`);
      const exportPath = resolve(buildDir, "AppStore");
      mkdirSync(exportPath, { recursive: true });

      runCommand(
        "xcodebuild",
        [
          "-exportArchive",
          "-archivePath",
          archivePath,
          "-exportPath",
          exportPath,
          "-exportOptionsPlist",
          plistToUse,
        ],
        iosDir,
      );

      const ipaPath = resolve(exportPath, "App.ipa");
      if (existsSync(ipaPath)) {
        const size = formatBytes(statSync(ipaPath).size);
        console.log(` IPA Exported: ${ipaPath} (${size})`);
      }
    } else {
      console.log(
        "\nNote: To export an IPA via CLI, supply --export-options-plist <path/to/exportOptions.plist>.",
      );
    }
  }
}

main().catch((err) => {
  console.error("\n❌ iOS release build failed:", err.message || err);
  process.exit(1);
});
