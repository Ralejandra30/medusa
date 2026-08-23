import { setPricingContext } from "../set-pricing-context"

jest.mock("@medusajs/framework/http", () => ({
  ...jest.requireActual("@medusajs/framework/http"),
  refetchEntity: jest.fn(),
  refetchEntities: jest.fn(),
}))

import { refetchEntity, refetchEntities } from "@medusajs/framework/http"

const mockedRefetchEntity = refetchEntity as unknown as jest.Mock
const mockedRefetchEntities = refetchEntities as unknown as jest.Mock

describe("setPricingContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedRefetchEntity.mockResolvedValue({
      id: "reg_1",
      currency_code: "usd",
    })
    mockedRefetchEntities.mockResolvedValue({
      data: [{ id: "cg_2" }, { id: "cg_1" }],
    })
  })

  const buildReq = (fields: string[]) =>
    ({
      queryConfig: { fields },
      filterableFields: { region_id: "reg_1" },
      scope: {},
      auth_context: { actor_id: "cus_1" },
    } as any)

  test("populates the pricing context with customer groups", async () => {
    const req = buildReq(["variants.calculated_price.calculated_amount"])
    const next = jest.fn()

    await setPricingContext()(req as any, undefined as any, next)

    expect(req.pricingContext).toEqual({
      region_id: "reg_1",
      currency_code: "usd",
      customer: { groups: [{ id: "cg_2" }, { id: "cg_1" }] },
    })
    expect(next).toHaveBeenCalledTimes(1)
  })

  test("skips pricing context population when no price fields are requested", async () => {
    const req = buildReq(["id", "title"])
    const next = jest.fn()

    await setPricingContext()(req as any, undefined as any, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(mockedRefetchEntity).not.toHaveBeenCalled()
  })
})
