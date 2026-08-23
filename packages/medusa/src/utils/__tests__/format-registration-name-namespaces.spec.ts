import path from "path"
import { formatRegistrationName } from "../format-registration-name"

describe("formatRegistrationName namespaced directories", () => {
  test("resolves the namespace against the parent of a double-underscore directory", () => {
    const filePath = path.join("src", "services", "__tests__", "my-file.js")

    expect(formatRegistrationName(filePath)).toBe("myFileService")
  })

  test("falls back to an empty namespace when there is no parent directory", () => {
    const filePath = path.join("__mocks__", "foo.js")

    expect(formatRegistrationName(filePath)).toBe("foo")
  })
})
