import { z } from "@medusajs/framework/zod"
import {
  createBatchBody,
  createFindParams,
  createLinkBody,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "../validators"

describe("createSelectParams", () => {
  test("accepts an optional fields string", () => {
    const schema = createSelectParams()

    expect(schema.safeParse({ fields: "id,title" }).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
    expect(schema.safeParse({ fields: 123 }).success).toBe(false)
  })
})

describe("createFindParams", () => {
  test("applies default offset and limit when nothing is provided", () => {
    const schema = createFindParams()
    const result = schema.parse({})

    expect(result).toMatchObject({ offset: 0, limit: 20 })
    expect(result.order).toBeUndefined()
  })

  test("coerces numeric strings coming from the query string", () => {
    const schema = createFindParams()
    const result = schema.parse({ offset: "10", limit: "5" })

    expect(result.offset).toBe(10)
    expect(result.limit).toBe(5)
  })

  test("honours custom defaults for offset, limit and order", () => {
    const schema = createFindParams({
      offset: 15,
      limit: 30,
      order: "created_at",
    })
    const result = schema.parse({})

    expect(result).toEqual({ offset: 15, limit: 30, order: "created_at" })
  })

  test("keeps explicit values over the configured defaults", () => {
    const schema = createFindParams({ offset: 15, limit: 30 })
    const result = schema.parse({ offset: "1", limit: "2", order: "title" })

    expect(result).toEqual({ offset: 1, limit: 2, order: "title" })
  })

  test("parses with_deleted query strings into booleans", () => {
    const schema = createFindParams()

    expect(schema.parse({ with_deleted: "true" }).with_deleted).toBe(true)
    expect(schema.parse({ with_deleted: "false" }).with_deleted).toBe(false)
    expect(schema.safeParse({ with_deleted: "not-a-bool" }).success).toBe(
      false
    )
  })

  test("rejects non numeric offsets", () => {
    const schema = createFindParams()

    expect(schema.safeParse({ offset: "abc" }).success).toBe(false)
  })
})

describe("createOperatorMap", () => {
  test("defaults to a string based operator map", () => {
    const schema = createOperatorMap()

    expect(schema.safeParse("value").success).toBe(true)
    expect(schema.safeParse(["a", "b"]).success).toBe(true)
    expect(schema.safeParse({ $eq: "a", $in: ["a", "b"] }).success).toBe(true)
    expect(schema.parse({ $unknown_operator: "a" })).toEqual({})
    expect(schema.safeParse(123).success).toBe(false)
  })

  test("supports custom value types", () => {
    const schema = createOperatorMap(z.number())

    expect(schema.safeParse(10).success).toBe(true)
    expect(schema.safeParse([10]).success).toBe(true)
    expect(schema.safeParse("not-a-number").success).toBe(false)
  })

  test("applies the provided value parser before validation", () => {
    const schema = createOperatorMap(z.number(), Number.parseFloat)

    expect(schema.parse("5.5")).toBe(5.5)
    expect(schema.safeParse({ $gt: "5.5" }).success).toBe(true)
  })
})

describe("createBatchBody", () => {
  test("builds optional create, update and delete arrays", () => {
    const schema = createBatchBody(z.string(), z.object({ id: z.string() }))

    expect(
      schema.safeParse({
        create: ["a"],
        update: [{ id: "b" }],
        delete: ["c"],
      }).success
    ).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
    expect(schema.safeParse({ delete: [123] }).success).toBe(false)
  })

  test("allows overriding the delete validator", () => {
    const schema = createBatchBody(
      z.string(),
      z.string(),
      z.number().int().positive()
    )

    expect(schema.safeParse({ delete: [1] }).success).toBe(true)
    expect(schema.safeParse({ delete: [-2] }).success).toBe(false)
  })
})

describe("createLinkBody", () => {
  test("builds optional add and remove arrays of ids", () => {
    const schema = createLinkBody()

    expect(schema.safeParse({ add: ["a"], remove: ["b"] }).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
    expect(schema.safeParse({ add: [1] }).success).toBe(false)
  })
})

describe("WithAdditionalData", () => {
  const originalSchema = z.object({ title: z.string() })

  test("accepts a nullish additional_data record without a validator", () => {
    const schemaFactory = WithAdditionalData(originalSchema)

    expect(
      schemaFactory().safeParse({ title: "t" }).success
    ).toBe(true)
    expect(
      schemaFactory().safeParse({
        title: "t",
        additional_data: { key: "value" },
      }).success
    ).toBe(true)
    expect(
      schemaFactory().safeParse({ title: "t", additional_data: null }).success
    ).toBe(true)
    expect(
      schemaFactory().safeParse({
        title: "t",
        additional_data: "not-a-record",
      }).success
    ).toBe(false)
  })

  test("validates additional_data with the provided validator", () => {
    const schemaFactory = WithAdditionalData(originalSchema)

    const schema = schemaFactory(
      z.record(z.string(), z.number()).nullish()
    )

    expect(
      schema.safeParse({ title: "t", additional_data: { count: 2 } }).success
    ).toBe(true)
    expect(
      schema.safeParse({ title: "t", additional_data: { count: "two" } })
        .success
    ).toBe(false)
  })

  test("applies the modify callback to the extended schema", () => {
    const schemaFactory = WithAdditionalData(originalSchema, (schema) =>
      schema.extend({ metadata: z.string().optional() })
    )

    const result = schemaFactory().parse({
      title: "t",
      additional_data: { key: "value" },
      metadata: "extra",
    })

    expect(result).toMatchObject({ title: "t", metadata: "extra" })
  })
})
