import { AdminCreateReservation, AdminGetReservationsParams } from "../validators"

describe("AdminGetReservationsParams quantity conversion", () => {
  test("converts a string quantity into a number via Number.parseFloat", () => {
    const result = AdminGetReservationsParams.parse({ quantity: "5" })

    expect(result.quantity).toBe(5)
  })

  test("converts decimal string quantities", () => {
    const result = AdminGetReservationsParams.parse({ quantity: "2.75" })

    expect(result.quantity).toBe(2.75)
  })

  test("parses quantity operator maps", () => {
    const result = AdminGetReservationsParams.parse({
      quantity: { $gte: "1.5", $lt: "10" },
    })

    expect(result.quantity).toEqual({ $gte: 1.5, $lt: 10 })
  })

  test("keeps numeric quantities untouched", () => {
    const result = AdminGetReservationsParams.parse({ quantity: 7 })

    expect(result.quantity).toBe(7)
  })

  test("rejects non numeric quantity strings", () => {
    const { success } = AdminGetReservationsParams.safeParse({
      quantity: "many",
    })

    expect(success).toBe(false)
  })
})

describe("AdminCreateReservation", () => {
  test("validates a well formed reservation payload", () => {
    const payload = {
      line_item_id: "line-item-1",
      location_id: "loc_1",
      inventory_item_id: "item_1",
      quantity: 1,
    }

    expect(() => AdminCreateReservation.parse(payload)).not.toThrow()
  })

  test("rejects unknown keys due to strict mode", () => {
    const { success } = AdminCreateReservation.safeParse({
      location_id: "loc_1",
      inventory_item_id: "item_1",
      quantity: 1,
      unexpected_key: true,
    })

    expect(success).toBe(false)
  })
})
