import { PolicyOperation, WILDCARD } from "@medusajs/framework/utils"
import { defaultPolicyOperations } from "../default-policy-operations"

describe("defaultPolicyOperations", () => {
  test("contains every policy operation except ALL and the wildcard", () => {
    const expected = Object.keys(PolicyOperation).filter(
      (key) => key !== "ALL" && key !== WILDCARD
    )

    expect(defaultPolicyOperations).toEqual(expected)
  })

  test("does not contain the ALL operation or the wildcard value", () => {
    expect(defaultPolicyOperations).not.toContain("ALL")
    expect(defaultPolicyOperations).not.toContain(WILDCARD)
  })
})
