import fs from "node:fs"
import path from "node:path"

const WINDOWS_EXECUTABLE_EXTENSIONS = [".exe", ".cmd", ".bat"]

function findExecutableInDirectory(
  directory: string,
  command: string
): string | undefined {
  const candidates =
    process.platform === "win32"
      ? [
          ...WINDOWS_EXECUTABLE_EXTENSIONS.map((ext) =>
            path.join(directory, `${command}${ext}`)
          ),
          path.join(directory, command),
        ]
      : [path.join(directory, command)]

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate
      }
    } catch {
      continue
    }
  }

  return undefined
}

export function resolveExecutablePath(command: string): string {
  if (path.isAbsolute(command)) {
    return command
  }

  const directories = (process.env.PATH ?? "")
    .split(path.delimiter)
    .filter(Boolean)

  for (const directory of directories) {
    const resolved = findExecutableInDirectory(directory, command)
    if (resolved) {
      return resolved
    }
  }

  return command
}
