import { getSetDifference } from "../diff-set"

describe("getSetDifference", () => {
  test("returns elements present in the original set but not in the compare set", () => {
    const result = getSetDifference(
      new Set([1, 2, 3]),
      new Set([2, 3, 4])
    )

    expect(result).toEqual(new Set([1]))
  })

  test("returns an empty set when both sets are equal", () => {
    const result = getSetDifference(new Set(["a", "b"]), new Set(["a", "b"]))

    expect(result.size).toBe(0)
  })

  test("returns all original elements when the compare set is empty", () => {
    const result = getSetDifference(new Set(["a", "b"]), new Set())

    expect(result).toEqual(new Set(["a", "b"]))
  })

  test("returns an empty set when the original set is empty", () => {
    const result = getSetDifference(new Set(), new Set(["a"]))

    expect(result.size).toBe(0)
  })

  test("does not mutate the input sets", () => {
    const original = new Set([1, 2])
    const compare = new Set([2])

    getSetDifference(original, compare)

    expect(original).toEqual(new Set([1, 2]))
    expect(compare).toEqual(new Set([2]))
  })
})
