import { validateRuleType } from "../validate-rule-type"

describe("validateRuleType", () => {
  test("accepts valid rule types", () => {
    expect(() => validateRuleType("rules")).not.toThrow()
    expect(() => validateRuleType("target_rules")).not.toThrow()
    expect(() => validateRuleType("buy_rules")).not.toThrow()
  })

  test("normalizes dasherized rule types before validating", () => {
    expect(() => validateRuleType("target-rules")).not.toThrow()
    expect(() => validateRuleType("buy-rules")).not.toThrow()
  })

  test("throws for unknown rule types", () => {
    expect(() => validateRuleType("unknown-type")).toThrow(
      "Invalid param rule_type (unknown-type)"
    )
  })
})
