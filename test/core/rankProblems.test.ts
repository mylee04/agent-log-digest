import { describe, expect, it } from "vitest"

import { rankProblems } from "../../src/core/rankProblems.js"
import type { Problem } from "../../src/core/types.js"

describe("rankProblems", () => {
  it("deprioritizes node_modules frames", () => {
    const problems: readonly Problem[] = [
      { id: "", severity: "error", tool: "generic", file: "node_modules/pkg/index.js", line: 1, column: 1, message: "dep", confidence: 0.7 },
      { id: "", severity: "error", tool: "generic", file: "src/index.ts", line: 1, column: 1, message: "app", confidence: 0.7 }
    ]

    expect(rankProblems(problems)[0]?.file).toBe("src/index.ts")
  })
})
