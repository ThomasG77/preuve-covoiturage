import {
  afterAll,
  assertEquals,
  assertObjectMatch,
  beforeAll,
  describe,
  it,
  supertest,
  SuperTestAgent,
} from "@/dev_deps.ts";
import { RPCCallType, RPCResponseType } from "@/ilos/common/index.ts";
import { Kernel } from "@/ilos/core/index.ts";
import { HttpTransport } from "./HttpTransport.ts";

describe("HttpTransport", () => {
  let request: SuperTestAgent | null = null;
  let httpTransport: HttpTransport | null = null;

  beforeAll(async () => {
    class BasicKernel extends Kernel {
      async handle(call: RPCCallType): Promise<RPCResponseType> {
        // generate errors from method name
        if ("method" in call) {
          switch (call.method) {
            case "test":
              // notifications return void
              if (call.id === undefined || call.id === null) {
                return;
              }

              return {
                id: 1,
                jsonrpc: "2.0",
                result: "hello world",
              };
            case "error":
              return {
                id: 1,
                jsonrpc: "2.0",
                error: {
                  code: -32000,
                  message: "Server error",
                },
              };
            case "invalidRequest":
              return {
                id: 1,
                jsonrpc: "2.0",
                error: {
                  code: -32600,
                  message: "Server error",
                },
              };
          }
        }

        return {
          id: 1,
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: "Method not found",
          },
        };
      }
    }

    const kernel = new BasicKernel();
    httpTransport = new HttpTransport(kernel);
    await httpTransport.up(["0"]);
    const httpInstance = httpTransport.getInstance();
    if (!httpInstance) throw new Error("Failed to get HTTP Transport instance");
    request = supertest(httpInstance);
  });

  afterAll(async () => {
    httpTransport && await httpTransport.down();
  });

  it.only("Http transport: returns JSON-RPC compliant success response", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "test",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");

    assertEquals(response.status, 200);
    assertObjectMatch(response.body, {
      id: 1,
      jsonrpc: "2.0",
      result: "hello world",
    });
  });

  it("Http transport: returns JSON-RPC compliant error response", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "returnAnError",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");

    assertEquals(response.status, 405);
    assertObjectMatch(response.body, {
      id: 1,
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not found",
      },
    });
  });

  it("Http transport: regular request", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "test",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 200);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertEquals(response.body.result, "hello world");
  });

  it("Http transport: notification request", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        jsonrpc: "2.0",
        method: "test",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 204);
    assertEquals(response.body, "");
  });

  it("Http transport: should fail if missing Accept header", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "test",
      })
      .set("Content-Type", "application/json");
    assertEquals(response.status, 415);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertObjectMatch(response.body.error, {
      code: -32000,
      message: "Wrong Content-type header. Requires application/json",
    });
  });

  // Content-type is infered from Accept header
  it("Http transport: should work without Content-type header", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "test",
      })
      .set("Accept", "application/json");
    assertEquals(response.status, 200);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertEquals(response.body.result, "hello world");
  });

  it("Http transport: should fail if http verb is not POST", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .get("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "test",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 405);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertObjectMatch(response.body.error, {
      code: -32601,
      message: "Method not allowed",
    });
  });

  it("Http transport: should fail if json is misformed", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send('{ "id": 1, jsonrpc: "2.0", "method": "test"}')
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 415);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertObjectMatch(response.body.error, {
      code: -32000,
      message: "Wrong content length",
    });
  });

  it("Http transport: should fail if service reject", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "error",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 500);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertObjectMatch(response.body.error, {
      code: -32000,
      message: "Server error",
    });
  });

  it("Http transport: should fail if request is invalid", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "invalidRequest",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 400);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertObjectMatch(response.body.error, {
      code: -32600,
      message: "Server error",
    });
  });

  it("Http transport: should fail if method is not found", async () => {
    if (!request) throw new Error("'request' must be initialised by SuperTest");
    const response = await request
      .post("/")
      .send({
        id: 1,
        jsonrpc: "2.0",
        method: "nonExistingMethod",
      })
      .set("Accept", "application/json")
      .set("Content-Type", "application/json");
    assertEquals(response.status, 405);
    assertEquals(response.body.id, 1);
    assertEquals(response.body.jsonrpc, "2.0");
    assertObjectMatch(response.body.error, {
      code: -32601,
      message: "Method not found",
    });
  });
});
