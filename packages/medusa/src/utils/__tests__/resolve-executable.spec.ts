import fs from "fs"
import os from "os"
import path from "path"
import { resolveExecutablePath } from "../resolve-executable"

describe("resolveExecutablePath", () => {
  const originalPathEnv = process.env.PATH
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "medusa-jest-path-"))
  })

  afterEach(() => {
    process.env.PATH = originalPathEnv
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test("returns absolute commands untouched", () => {
    const absoluteCommand = path.join(tmpDir, "tool.exe")

    expect(resolveExecutablePath(absoluteCommand)).toBe(absoluteCommand)
  })

  test("returns the command unchanged when PATH is empty", () => {
    process.env.PATH = ""

    expect(resolveExecutablePath("medusa-cli")).toBe("medusa-cli")
  })

  test("returns the command unchanged when it cannot be found on PATH", () => {
    process.env.PATH = tmpDir

    expect(resolveExecutablePath("does-not-exist-anywhere")).toBe(
      "does-not-exist-anywhere"
    )
  })

  test("resolves an executable located in one of the PATH directories", () => {
    process.env.PATH = tmpDir

    const candidate =
      process.platform === "win32"
        ? path.join(tmpDir, "medusa-tool.cmd")
        : path.join(tmpDir, "medusa-tool")
    fs.writeFileSync(candidate, "")

    expect(resolveExecutablePath("medusa-tool")).toBe(candidate)
  })

  test("prefers Windows executable extensions over the bare name", () => {
    if (process.platform !== "win32") {
      pending("windows only behaviour")
      return
    }

    process.env.PATH = tmpDir
    const bare = path.join(tmpDir, "dual-tool")
    const cmd = path.join(tmpDir, "dual-tool.cmd")
    fs.writeFileSync(bare, "")
    fs.writeFileSync(cmd, "")

    expect(resolveExecutablePath("dual-tool")).toBe(cmd)
  })

  test("ignores PATH entries that are directories instead of files", () => {
    process.env.PATH = tmpDir
    fs.mkdirSync(path.join(tmpDir, "dir-only"))

    expect(resolveExecutablePath("dir-only")).toBe("dir-only")
  })
})
