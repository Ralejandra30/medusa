import { MedusaError } from "@medusajs/framework/utils"
import { formatException } from "../exception-formatter"

describe("formatException", () => {
  test("returns the original exception when it has no known postgres code", () => {
    const err = new Error("boom")

    expect(formatException(err)).toBe(err)
  })

  test("formats postgres duplicate errors into a duplicate error MedusaError", () => {
    const err = {
      code: "23505",
      table: "product",
      detail: "Key (sku)=(shirt) already exists.",
    }

    const result = formatException(err)

    expect(result).toBeInstanceOf(MedusaError)
    expect(result.type).toBe(MedusaError.Types.DUPLICATE_ERROR)
    expect(result.message).toBe("Product with sku shirt already exists.")
  })

  test("formats postgres foreign key errors into a not found MedusaError", () => {
    const err = {
      code: "23503",
      detail:
        'Key (customer_id)=(cus_1) is not present in table "customer".',
    }

    const result = formatException(err)

    expect(result).toBeInstanceOf(MedusaError)
    expect(result.type).toBe(MedusaError.Types.NOT_FOUND)
    expect(result.message).toBe(
      "Customer with customer_id cus_1 does not exist."
    )
  })

  test("formats postgres serialization failures into a conflict MedusaError", () => {
    const err = {
      code: "40001",
      detail: "could not serialize access due to concurrent update",
    }

    const result = formatException(err)

    expect(result.type).toBe(MedusaError.Types.CONFLICT)
    expect(result.message).toBe(
      "could not serialize access due to concurrent update"
    )
  })

  test("formats postgres null violations into an invalid data MedusaError", () => {
    const err = {
      code: "23502",
      column: "title",
      table: "product",
    }

    const result = formatException(err)

    expect(result.type).toBe(MedusaError.Types.INVALID_DATA)
    expect(result.message).toBe(
      "Can't insert null value in field title on insert in table product"
    )
  })
})
