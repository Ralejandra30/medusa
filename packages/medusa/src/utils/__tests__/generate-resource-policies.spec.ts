import { generateResourcePolicies } from "../generate-resource-policies"
import { defaultPolicyOperations } from "../default-policy-operations"

describe("generateResourcePolicies", () => {
  test("generates one policy per default operation for each resource", () => {
    const policies = generateResourcePolicies(["product"])

    expect(policies).toHaveLength(defaultPolicyOperations.length)
    expect(policies.map((p) => p.operation)).toEqual(
      expect.arrayContaining(defaultPolicyOperations)
    )
  })

  test("builds PascalCase policy names, descriptions and keeps raw resource", () => {
    const policies = generateResourcePolicies(["product"])

    expect(policies).toContainEqual({
      name: "CreateProduct",
      resource: "product",
      operation: "create",
      description: "Create Product",
    })
    expect(policies).toContainEqual({
      name: "ReadProduct",
      resource: "product",
      operation: "read",
      description: "Read Product",
    })
    expect(policies).toContainEqual({
      name: "UpdateProduct",
      resource: "product",
      operation: "update",
      description: "Update Product",
    })
    expect(policies).toContainEqual({
      name: "DeleteProduct",
      resource: "product",
      operation: "delete",
      description: "Delete Product",
    })
  })

  test("normalizes snake_case resources into PascalCase", () => {
    const policies = generateResourcePolicies(["product_type"])

    expect(policies).toContainEqual({
      name: "CreateProductType",
      resource: "product_type",
      operation: "create",
      description: "Create ProductType",
    })
  })

  test("supports multiple resources without name collisions", () => {
    const policies = generateResourcePolicies(["product", "product_variant"])

    expect(policies).toHaveLength(defaultPolicyOperations.length * 2)

    const names = policies.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
