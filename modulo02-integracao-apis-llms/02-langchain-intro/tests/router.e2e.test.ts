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

test("make lower transforms message into lowercase", async () => {
  const app = createServer();
  const msg = 'MAKE THIS MESSAGE LOWER PLEASE!';
  const expected = msg.toLowerCase();
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

test("make unknown command returns fallback message", async () => {
  const app = createServer();
  const msg = 'MAKE THIS MESSAGE UNKNOWN PLEASE!';
  const expected = "Unknown command. Please use 'upper' or 'lower' in your input.";
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

