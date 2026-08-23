const childProcess = require("child_process")

describe("mcloud command", () => {
  let spawnSyncSpy: jest.SpyInstance
  let spawnSpy: jest.SpyInstance
  let exitSpy: jest.SpyInstance

  beforeAll(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("__exit__")
    }) as any)
  })

  afterAll(() => {
    exitSpy.mockRestore()
  })

  beforeEach(() => {
    const fakeChild = { on: jest.fn() }
    spawnSyncSpy = jest
      .spyOn(childProcess, "spawnSync")
      .mockReturnValue({ status: 0, error: null } as any)
    spawnSpy = jest
      .spyOn(childProcess, "spawn")
      .mockReturnValue(fakeChild as any)
  })

  afterEach(() => {
    spawnSyncSpy.mockRestore()
    spawnSpy.mockRestore()
  })

  test("proxies to the resolved mcloud executable when it is installed", async () => {
    const mcloud = require("../mcloud").default

    await mcloud({ args: ["--help"] })

    expect(spawnSyncSpy).toHaveBeenCalledWith(
      expect.stringContaining("mcloud"),
      ["--version"],
      expect.anything()
    )
    expect(spawnSpy).toHaveBeenCalledWith(
      expect.stringContaining("mcloud"),
      ["--help"],
      expect.anything()
    )
  })
})
