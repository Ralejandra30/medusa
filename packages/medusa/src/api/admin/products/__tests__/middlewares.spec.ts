import { adminProductRoutesMiddlewares } from "../middlewares"

describe("adminProductRoutesMiddlewares", () => {
  test("registers product route middlewares", () => {
    expect(Array.isArray(adminProductRoutesMiddlewares)).toBe(true)
    expect(adminProductRoutesMiddlewares.length).toBeGreaterThan(0)
  })

  test("defines routes with matchers and methods", () => {
    const hasMatcher = adminProductRoutesMiddlewares.every(
      (middleware) =>
        middleware.matcher !== undefined || middleware.method !== undefined
    )

    expect(hasMatcher).toBe(true)
  })
})
