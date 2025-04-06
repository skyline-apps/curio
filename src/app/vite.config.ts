import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr({
      include: /\.svg(\?v=\d+)?$/,
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  publicDir: "public",
  resolve: {
    alias: {
      "@app": path.resolve(__dirname),
    },
  },
});
