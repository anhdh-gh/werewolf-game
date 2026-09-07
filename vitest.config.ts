import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    // Task 6's rules.test.ts calls clearDatabase() against the same emulator
    // namespace Tasks 8-10's tests write to. Running test files in parallel
    // would let that wipe collide with another file's in-flight assertions.
    fileParallelism: false,
  },
});
