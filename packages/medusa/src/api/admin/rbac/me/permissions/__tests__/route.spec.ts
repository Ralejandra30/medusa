import { resolvePermissions } from "@medusajs/framework"

jest.mock("@medusajs/framework", () => ({
  ...jest.requireActual("@medusajs/framework"),
  resolvePermissions: jest.fn(),
}))

const mockedResolvePermissions = resolvePermissions as unknown as jest.Mock

describe("rbac me permissions route", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function buildDeps() {
    const query = {
      graph: jest.fn(async ({ entity }: { entity: string }) => {
        if (entity === "user") {
          return {
            data: [{ id: "user_1", rbac_roles: [{ id: "role_1" }] }],
          }
        }
        return { data: [{ resource: "order", operation: "read" }] }
      }),
    }

    return {
      req: {
        auth_context: { actor_id: "user_1", actor_type: "user" },
        scope: { resolve: jest.fn(() => query) },
      },
      res: {
        status: jest.fn(function (this: any) {
          return this
        }),
        json: jest.fn(),
      },
    }
  }

  test("returns the permission list sorted with localeCompare", async () => {
    mockedResolvePermissions.mockResolvedValue(
      new Set(["product:create", "order:read", "product:read"])
    )

    const { req, res } = buildDeps()

    await require("../route").GET(req as any, res as any)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      permissions: ["order:read", "product:create", "product:read"],
    })
    expect(mockedResolvePermissions).toHaveBeenCalledTimes(1)
  })

  test("responds with an empty list when there is no authenticated actor", async () => {
    const { req, res } = buildDeps()
    req.auth_context.actor_id = undefined

    await require("../route").GET(req as any, res as any)

    expect(res.json).toHaveBeenCalledWith({ permissions: [] })
    expect(mockedResolvePermissions).not.toHaveBeenCalled()
  })
})
