import { AdminGetInventoryItemsParams } from "../validators"

describe("AdminGetInventoryItemsParams dimension conversions", () => {
  test("converts a string weight into a number via Number.parseFloat", () => {
    const result = AdminGetInventoryItemsParams.parse({ weight: "12.5" })

    expect(result.weight).toBe(12.5)
  })

  test("converts string length, height and width", () => {
    const result = AdminGetInventoryItemsParams.parse({
      length: "10",
      height: "20.25",
      width: "5.5",
    })

    expect(result.length).toBe(10)
    expect(result.height).toBe(20.25)
    expect(result.width).toBe(5.5)
  })

  test("parses operator maps for dimensions", () => {
    const result = AdminGetInventoryItemsParams.parse({
      weight: { $gte: "1", $lt: "9.5" },
    })

    expect(result.weight).toEqual({ $gte: 1, $lt: 9.5 })
  })

  test("rejects non numeric weight strings", () => {
    const { success } = AdminGetInventoryItemsParams.safeParse({
      weight: "heavy",
    })

    expect(success).toBe(false)
  })

  test("accepts arrays of strings for sku filters", () => {
    const result = AdminGetInventoryItemsParams.parse({
      sku: ["sku_1", "sku_2"],
    })

    expect(result.sku).toEqual(["sku_1", "sku_2"])
  })
})
