import { parseJestLikeJson, parseRawJestLike } from "./jestLike.js"
import type { Problem } from "../core/types.js"

export const parseVitest = (log: string): readonly Problem[] => {
  const jsonProblems = parseJestLikeJson(log, "vitest")
  if (jsonProblems.length > 0) return jsonProblems
  return parseRawJestLike(log, "vitest")
}
