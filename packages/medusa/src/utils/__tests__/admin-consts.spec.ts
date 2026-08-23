import {
  ADMIN_ONLY_OUTPUT_DIR,
  ADMIN_RELATIVE_OUTPUT_DIR,
  ADMIN_SOURCE_DIR,
} from "../admin-consts"

describe("admin-consts", () => {
  test("exports the admin source directory", () => {
    expect(ADMIN_SOURCE_DIR).toBe("src/admin")
  })

  test("exports the admin relative output directory", () => {
    expect(ADMIN_RELATIVE_OUTPUT_DIR).toBe("./public/admin")
  })

  test("exports the admin only output directory", () => {
    expect(ADMIN_ONLY_OUTPUT_DIR).toBe(".medusa/admin")
  })
})
