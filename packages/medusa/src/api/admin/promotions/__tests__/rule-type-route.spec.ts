import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  getRuleAttributesMap: jest.fn(() => ({
    rules: [
      {
        id: "customer_group",
        value: "customer_group.id",
        label: "Customer group",
        field_type: "string",
      },
    ],
  })),
}))

const { GET } = require("../[id]/[rule_type]/route")

describe("promotion rule type route", () => {
  test("hydrates rule values through the remote query", async () => {
    const remoteQuery = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "promo_1",
          rules: [
            {
              attribute: "customer_group",
              values: [{ value: "cg_1" }],
            },
          ],
        },
      ])
      .mockResolvedValueOnce([{ id: "cg_1", name: "VIP" }])

    const req = {
      params: { id: "promo_1", rule_type: "rules" },
      queryConfig: { fields: ["id"] },
      query: {},
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.REMOTE_QUERY) {
            return remoteQuery
          }
          throw new Error(`unexpected key: ${key}`)
        }),
      },
    }
    const res = { json: jest.fn() }

    await GET(req as any, res as any)

    expect(res.json).toHaveBeenCalledWith({
      rules: [
        expect.objectContaining({
          attribute: "customer_group",
          values: [{ value: "cg_1", label: "VIP" }],
        }),
      ],
    })
  })

  test("rejects invalid rule types", async () => {
    const req = {
      params: { id: "promo_1", rule_type: "invalid-rule" },
      queryConfig: { fields: ["id"] },
      query: {},
      scope: { resolve: jest.fn() },
    }
    const res = { json: jest.fn() }

    await expect(GET(req as any, res as any)).rejects.toThrow(
      "Invalid param rule_type"
    )
  })
})
