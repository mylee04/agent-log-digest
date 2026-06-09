import { defineConfig } from "vitest/config"

export const vitestConfig = defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  }
})

export default vitestConfig
