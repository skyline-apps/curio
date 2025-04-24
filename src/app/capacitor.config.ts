import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ooo.curi.app",
  appName: "Curio",
  webDir: "dist/client",
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
