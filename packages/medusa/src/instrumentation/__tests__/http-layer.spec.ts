import { instrumentHttpLayer } from "../index"
import * as startCommand from "../../commands/start"

describe("instrumentHttpLayer", () => {
  test("registers the request handler tracing hook", () => {
    instrumentHttpLayer()

    expect(typeof startCommand.requestHandlerTracing.handler).toBe("function")
  })
})
