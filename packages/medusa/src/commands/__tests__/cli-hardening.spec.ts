import express from "express"

const exitSpy = jest
  .spyOn(process, "exit")
  .mockImplementation((() => null) as any)

jest.mock("../../loaders", () => {
  const logger = { info: jest.fn(), error: jest.fn() }
  const container = {
    resolve: jest.fn((key: string) => {
      if (key === "logger") {
        return logger
      }
      throw new Error(`unresolvable: ${key}`)
    }),
  }
  return {
    __esModule: true,
    default: jest.fn(async () => ({ container })),
    initializeContainer: jest.fn(async () => container),
  }
})

const telemetry = require("@medusajs/telemetry")
telemetry.track = jest.fn()

describe("cli commands hardening", () => {
  afterAll(() => {
    exitSpy.mockRestore()
  })

  test("exec disables the x-powered-by header and reports missing scripts", async () => {
    const disableSpy = jest.spyOn(express.application, "disable")
    const exec = require("../exec").default

    await expect(
      exec({ file: "does-not-exist.js", args: [] })
    ).resolves.toBeUndefined()

    expect(disableSpy).toHaveBeenCalledWith("x-powered-by")

    disableSpy.mockRestore()
  })

  test("user disables the x-powered-by header before bootstrapping", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const disableSpy = jest.spyOn(express.application, "disable")
    const user = require("../user").default

    await expect(
      user({
        directory: __dirname,
        id: undefined,
        email: "admin@medusa.test",
        password: "secret",
        keepAlive: true,
        invite: false,
      })
    ).resolves.toBeUndefined()

    expect(disableSpy).toHaveBeenCalledWith("x-powered-by")

    consoleErrorSpy.mockRestore()
    disableSpy.mockRestore()
  })
})
