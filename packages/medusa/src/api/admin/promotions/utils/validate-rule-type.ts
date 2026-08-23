import { MedusaError, RuleType } from "@medusajs/framework/utils"

const validRuleTypes: string[] = Object.values(RuleType)

export function validateRuleType(ruleType: string) {
  const underscorizedRuleType = ruleType.replaceAll("-", "_")

  if (!validRuleTypes.includes(underscorizedRuleType)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid param rule_type (${ruleType})`
    )
  }
}
