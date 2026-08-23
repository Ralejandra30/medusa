import {
  AdminGetOrdersOrderItemsParams,
  AdminGetOrdersOrderParams,
} from "../validators"

describe("AdminGetOrdersOrderParams", () => {
  test("converts a string version into a number via Number.parseInt", () => {
    const result = AdminGetOrdersOrderParams.parse({ version: "2" })

    expect(result.version).toBe(2)
  })

  test("keeps numeric versions untouched", () => {
    const result = AdminGetOrdersOrderParams.parse({ version: 3 })

    expect(result.version).toBe(3)
  })

  test("allows the version to be omitted", () => {
    const result = AdminGetOrdersOrderParams.parse({})

    expect(result.version).toBeUndefined()
  })

  test("rejects an empty string version", () => {
    const { success } = AdminGetOrdersOrderParams.safeParse({ version: "" })

    expect(success).toBe(false)
  })

  test("rejects non numeric string versions", () => {
    const { success } = AdminGetOrdersOrderParams.safeParse({
      version: "not-a-number",
    })

    expect(success).toBe(false)
  })
})

describe("AdminGetOrdersOrderItemsParams", () => {
  test("converts a string version into a number", () => {
    const result = AdminGetOrdersOrderItemsParams.parse({
      id: "order-item-1",
      version: "1",
    })

    expect(result.version).toBe(1)
  })

  test("accepts item_id and numeric versions", () => {
    const result = AdminGetOrdersOrderItemsParams.parse({
      item_id: ["item-1"],
      version: 4,
    })

    expect(result.item_id).toEqual(["item-1"])
    expect(result.version).toBe(4)
  })
})
