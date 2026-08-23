import { DEFAULT_UPLOAD_FILE_SIZE_LIMIT_BYTES } from "../../../../utils/middlewares"
import { adminUploadRoutesMiddlewares } from "../middlewares"

describe("adminUploadRoutesMiddlewares", () => {
  test("registers middlewares as an array", () => {
    expect(Array.isArray(adminUploadRoutesMiddlewares)).toBe(true)
    expect(adminUploadRoutesMiddlewares.length).toBeGreaterThan(0)
  })

  test("uses the default upload file size limit of 50 MB", () => {
    expect(DEFAULT_UPLOAD_FILE_SIZE_LIMIT_BYTES).toBe(50 * 1024 * 1024)
  })
})
