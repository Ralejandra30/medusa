import { cleanResponseData } from "../clean-response-data"

const order = {
  id: "ord_1",
  status: "pending",
  total: 1000,
  subtotal: 900,
  raw_discount_total: 100,
  customer: { id: "cus_1", email: "test@medusa.com" },
}

describe("cleanResponseData", () => {
  test("only removes excluded fields when no allowed fields are provided", () => {
    const result = cleanResponseData(order, [])
    const { raw_discount_total, ...expected } = order

    expect(result).toEqual(expected)
    expect(result).not.toHaveProperty("raw_discount_total")
    expect(result?.total).toBe(1000)
  })

  test("keeps the computed total fields present in the record", () => {
    const result = cleanResponseData(
      { id: "ord_1", total: 500, subtotal: 400 },
      ["id"]
    )

    expect(result).toEqual({ id: "ord_1", total: 500, subtotal: 400 })
  })

  test("picks only the requested fields on a single record", () => {
    const result = cleanResponseData(order, ["id"])

    expect(result).toEqual({
      id: "ord_1",
      total: 1000,
      subtotal: 900,
    })
  })

  test("supports dot notation to pick nested fields", () => {
    const result = cleanResponseData(order, ["id", "customer.email"])

    expect(result).toEqual({
      id: "ord_1",
      total: 1000,
      subtotal: 900,
      customer: { email: "test@medusa.com" },
    })
  })

  test("applies the same rules to every record of an array", () => {
    const result = cleanResponseData([order, { ...order, id: "ord_2" }], [
      "id",
    ])

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result?.[0]).toEqual({ id: "ord_1", total: 1000, subtotal: 900 })
    expect(result?.[1]).toEqual({ id: "ord_2", total: 1000, subtotal: 900 })
    expect(result?.[0]).not.toHaveProperty("raw_discount_total")
  })

  test("removes excluded fields inside arrays of nested records", () => {
    const data = {
      id: "ord_1",
      items: [{ id: "item_1", raw_discount_total: 5 }],
    }

    const result = cleanResponseData(data, ["items.id"])

    expect(result).toEqual({ items: [{ id: "item_1" }] })
  })

  test("treats nullish fields config as no fields at all", () => {
    const result = cleanResponseData({ id: "ord_1", raw_discount_total: 3 }, undefined as any)

    expect(result).toEqual({ id: "ord_1" })
    expect(result).not.toHaveProperty("raw_discount_total")
  })
})
