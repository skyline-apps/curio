import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ooo.curi.app",
  appName: "Curio",
  webDir: "dist/client",
  server: {
    hostname: "curio",
  },
};

export default config;
