export const normalizeFilePath = (filePath: string): string => {
  const normalized = filePath.replaceAll("\\", "/")
  const srcIndex = normalized.indexOf("/src/")
  if (srcIndex >= 0) {
    return normalized.slice(srcIndex + 1)
  }
  const testIndex = normalized.indexOf("/test/")
  if (testIndex >= 0) {
    return normalized.slice(testIndex + 1)
  }
  return filePath
}
