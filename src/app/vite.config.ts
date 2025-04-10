import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(() => {
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
