import { Modules } from "@medusajs/framework/utils"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const workflowSubscribeRoute = require("../[workflow_id]/subscribe/route")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const transactionSubscribeRoute = require("../[workflow_id]/[transaction_id]/subscribe/route")

function createMockReq(params: Record<string, string>) {
  const handlers: Record<string, (...args: any[]) => void> = {}
  return {
    req: {
      params,
      on: jest.fn((event: string, cb: (...args: any[]) => void) => {
        handlers[event] = cb
      }),
    },
    handlers,
  }
}

function createMockRes() {
  return {
    writeHead: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  }
}

describe.each([
  ["workflow subscribe", workflowSubscribeRoute],
  ["transaction subscribe", transactionSubscribeRoute],
])("%s route", (_name, route) => {
  test("subscribes with a uuid based subscriber id and streams SSE headers", async () => {
    const subscribe = jest.fn().mockResolvedValue(undefined)
    const unsubscribe = jest.fn().mockResolvedValue(undefined)
    const workflowEngineService = { subscribe, unsubscribe }

    const scope = {
      resolve: jest.fn(() => workflowEngineService),
    }
    const { req, handlers } = createMockReq({ workflow_id: "wf_1" })
    const res = createMockRes()

    await route.GET(Object.assign(req, { scope }), res)

    expect(scope.resolve).toHaveBeenCalledWith(Modules.WORKFLOW_ENGINE)
    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      })
    )

    const subscribeArgs = subscribe.mock.calls[0][0]
    expect(subscribeArgs.workflowId).toBe("wf_1")
    expect(subscribeArgs.subscriberId).toMatch(/^__sub__[0-9a-f-]{36}$/)

    subscribeArgs.subscriber({
      eventType: "execute",
      workflowId: "wf_1",
      transactionId: "tx_1",
      step: "step_1",
      response: {},
      result: {},
      errors: [],
    })
    expect(res.write).toHaveBeenCalledWith(expect.stringContaining("event:"))

    handlers.close?.()
    expect(res.end).toHaveBeenCalled()
    expect(unsubscribe).toHaveBeenCalledWith({
      workflowId: "wf_1",
      subscriberOrId: subscribeArgs.subscriberId,
    })
  })
})
