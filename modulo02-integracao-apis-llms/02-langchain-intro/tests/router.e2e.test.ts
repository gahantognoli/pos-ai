import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.ts";

test("make upper transforms message into UPPERCASE", async () => {
  const app = createServer();
  const msg = 'make THis message UPPER please!';
  const expected = msg.toUpperCase();
  const response = await app.inject({
    method: "POST",
    url: "/chat",
    payload: {
      question: msg,
    },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, expected);
});


