import { parseJestLikeJson, parseRawJestLike } from "./jestLike.js"
import type { Problem } from "../core/types.js"

export const parseJest = (log: string): readonly Problem[] => {
  const jsonProblems = parseJestLikeJson(log, "jest")
  if (jsonProblems.length > 0) return jsonProblems
  return parseRawJestLike(log, "jest")
}
