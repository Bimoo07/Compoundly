import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Netlify menyediakan COMMIT_REF saat build; lokal memakai git; fallback "dev".
function commitHash() {
  const fromEnv = process.env.COMMIT_REF;
  if (fromEnv) return fromEnv.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commitHash()),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setupTests.js",
    globals: true,
  },
});
