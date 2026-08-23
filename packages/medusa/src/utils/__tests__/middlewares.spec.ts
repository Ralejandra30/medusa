import {
  authenticate,
  DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
  DEFAULT_UPLOAD_FILE_SIZE_LIMIT_BYTES,
  errorHandler,
} from "../middlewares"

describe("middlewares utils", () => {
  test("re-exports the framework authenticate middleware", () => {
    expect(typeof authenticate).toBe("function")
  })

  test("re-exports the framework error handler", () => {
    expect(typeof errorHandler).toBe("function")
  })

  test("exports the default batch endpoints size limit", () => {
    expect(DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT).toBe("2mb")
  })

  test("exports the default upload file size limit in bytes", () => {
    expect(DEFAULT_UPLOAD_FILE_SIZE_LIMIT_BYTES).toBe(50 * 1024 * 1024)
  })
})
