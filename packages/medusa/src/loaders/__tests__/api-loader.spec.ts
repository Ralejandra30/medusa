import { ApiLoader } from "@medusajs/framework/http"

jest.mock("@medusajs/framework/http", () => ({
  ...jest.requireActual("@medusajs/framework/http"),
  ApiLoader: jest.fn(),
}))

const MockedApiLoader = ApiLoader as unknown as jest.Mock

describe("api loader", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("wraps route registration errors with a descriptive message", async () => {
    const load = jest.fn().mockRejectedValue(new Error("boom"))
    MockedApiLoader.mockImplementation(function () {
      return { load }
    })

    const app = { use: jest.fn() }
    const container = {
      resolve: jest.fn(() => ({
        projectConfig: { http: { restrictedFields: {} } },
      })),
    }

    const apiLoader = require("../api").default

    await expect(
      apiLoader({ app, container, plugins: [] })
    ).rejects.toThrow(
      "An error occurred while registering API Routes. Error: boom"
    )
    expect(app.use).toHaveBeenCalled()
    expect(MockedApiLoader).toHaveBeenCalledTimes(1)
  })
})
