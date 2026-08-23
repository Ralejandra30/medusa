import * as utils from "@medusajs/framework/utils"
import path from "path"
import * as instrumentationFixture from "../__fixtures__/instrumentation"
import * as instrumentationFailureFixture from "../__fixtures__/instrumentation-failure/instrumentation"
import { parseValueOrPercentage, registerInstrumentation } from "../start"

const logger = {
  info: jest.fn(),
  error: jest.fn(),
}

jest.mock("@medusajs/framework/config", () => {
  return {
    configManager: {
      config: {},
    },
    configLoader: jest.fn().mockImplementation(() => {
      return {
        logger,
      }
    }),
  }
})

describe("start", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.doMock("@medusajs/framework/utils", () => ({
      ...jest.requireActual("@medusajs/framework/utils"),
      createMedusaContainer: jest.fn(() => ({
        resolve: jest.fn(() => logger),
      })),
    }))
  })

  describe("registerInstrumentation", () => {
    it("should not throw when registering the instrumentation if the file is not ", async () => {
      const fsSpy = jest.spyOn(
        utils.FileSystem.prototype,
        "exists",
        "" as never
      )

      await registerInstrumentation(__dirname)

      expect(fsSpy).toHaveBeenCalled()
      expect(fsSpy).toHaveBeenCalledWith(
        expect.stringContaining("instrumentation.js")
      )
    })

    it("should log an info message if the file is present but not register function is found", async () => {
      const fsSpy = jest.spyOn(
        utils.FileSystem.prototype,
        "exists",
        "" as never
      )
      const loggerSpy = jest.spyOn(logger, "info", "" as never)

      await registerInstrumentation(
        path.join(__dirname, "../__fixtures__/instrumentation-no-register")
      )

      expect(fsSpy).toHaveBeenCalled()
      expect(fsSpy).toHaveBeenCalledWith(
        expect.stringContaining("instrumentation.js")
      )

      expect(loggerSpy).toHaveBeenCalled()
      expect(loggerSpy).toHaveBeenCalledWith(
        "Skipping instrumentation registration. No register function found."
      )
    })

    it("should register the instrumentation if the file is present and exports a register function", async () => {
      const fsSpy = jest.spyOn(
        utils.FileSystem.prototype,
        "exists",
        "" as never
      )

      instrumentationFixture.registerMock.mockReturnValue(true)

      await registerInstrumentation(path.join(__dirname, "../__fixtures__"))

      expect(fsSpy).toHaveBeenCalled()
      expect(instrumentationFixture.registerMock).toHaveBeenCalled()

      expect(fsSpy).toHaveBeenCalledWith(
        expect.stringContaining("instrumentation.js")
      )
    })

    it("should throw if the instrumentation file exists but cannot be imported", async () => {
      const fsSpy = jest.spyOn(
        utils.FileSystem.prototype,
        "exists",
        "" as never
      )

      const err = await registerInstrumentation(
        path.join(__dirname, "../__fixtures__/instrumentation-failure")
      ).catch((e) => e)

      expect(fsSpy).toHaveBeenCalled()
      expect(instrumentationFailureFixture.registerMock).toHaveBeenCalled()

      expect(fsSpy).toHaveBeenCalledWith(
        expect.stringContaining("instrumentation.js")
      )

      expect(err).toBeInstanceOf(Error)
    })
  })
})

describe("parseValueOrPercentage", () => {
  test("parses a plain non-negative integer", () => {
    expect(parseValueOrPercentage("4", 10)).toBe(4)
    expect(parseValueOrPercentage("0", 10)).toBe(0)
  })

  test("trims whitespace before parsing an integer", () => {
    expect(parseValueOrPercentage("  7  ", 10)).toBe(7)
  })

  test("converts a percentage string into a rounded portion of the base", () => {
    expect(parseValueOrPercentage("50%", 10)).toBe(5)
    expect(parseValueOrPercentage("33%", 10)).toBe(3)
    expect(parseValueOrPercentage("100%", 8)).toBe(8)
    expect(parseValueOrPercentage("0%", 8)).toBe(0)
  })

  test("trims and parses decimal percentages via Number.parseFloat", () => {
    expect(parseValueOrPercentage(" 12.5% ", 100)).toBe(13)
  })

  test("throws when the value is not a string", () => {
    expect(() => parseValueOrPercentage(undefined as any, 10)).toThrow(
      "Invalid value"
    )
    expect(() => parseValueOrPercentage(null as any, 10)).toThrow(
      "Must be a string"
    )
  })

  test("throws when a percentage is not numeric (Number.isNaN)", () => {
    expect(() => parseValueOrPercentage("abc%", 10)).toThrow(
      "Invalid percentage: abc%"
    )
  })

  test("throws when a percentage is out of range", () => {
    expect(() => parseValueOrPercentage("101%", 10)).toThrow(
      "Percentage must be between 0 and 100: 101%"
    )
    expect(() => parseValueOrPercentage("-5%", 10)).toThrow(
      "Percentage must be between 0 and 100: -5%"
    )
  })

  test("throws when the integer is not numeric (Number.parseInt + Number.isNaN)", () => {
    expect(() => parseValueOrPercentage("abc", 10)).toThrow(
      "Invalid number: abc. Must be a non-negative integer."
    )
  })

  test("throws when the integer is negative", () => {
    expect(() => parseValueOrPercentage("-1", 10)).toThrow(
      "Must be a non-negative integer"
    )
  })
})
