/* eslint-disable no-console */
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  let port = 3000;
  const curioUrl = env.VITE_CURIO_URL || process.env.VITE_CURIO_URL;
  if (curioUrl) {
    try {
      const parsedUrl = new URL(curioUrl);
      if (parsedUrl.port) {
        port = parseInt(parsedUrl.port, 10);
      }
    } catch (e) {
      console.error("Failed to parse VITE_CURIO_URL port:", e);
    }
  } else if (process.env.PORT || env.PORT) {
    port = parseInt(process.env.PORT || env.PORT, 10);
  }

  return {
    plugins: [
      svgr({
        include: /\.svg(\?v=\d+)?$/,
      }),
      react(),
      cloudflare(),
      tsconfigPaths(),
    ],
    publicDir: "public",
    resolve: {
      alias: {
        "@app": path.resolve(__dirname),
      },
    },
    server: {
      port,
      host: true,
      fs: {
        strict: true,
        allow: [
          path.resolve(__dirname, "index.html"),
          path.resolve(__dirname, "main.tsx"),
          path.resolve(__dirname, "App.tsx"),
          path.resolve(__dirname, "globals.css"),
          path.resolve(__dirname, "components"),
          path.resolve(__dirname, "layouts"),
          path.resolve(__dirname, "node_modules"),
          path.resolve(__dirname, "pages"),
          path.resolve(__dirname, "providers"),
          path.resolve(__dirname, "schemas"),
          path.resolve(__dirname, "styles"),
          path.resolve(__dirname, "utils"),
        ],
      },
    },
  };
});
