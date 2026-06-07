import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.ts";
import { config } from "../src/config.ts";
import { type LLMResponse, OpenRouterService } from "../src/openrouterService.ts";

console.assert(
  process.env.OPENROUTER_API_KEY,
  "OPENROUTER_API_KEY is not set in environment variables",
);

test("routes to cheapes model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "price",
      },
    },
  };
  const routerService = new OpenRouterService(customConfig);
  const app = createServer(routerService);

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    payload: {
      question: "What is the meaning of life?",
    },
  });
  assert.equal(response.statusCode, 200);
  const responseBody = response.json() as LLMResponse;
  assert.equal(responseBody.model, "google/gemma-4-31b-it-20260402:free");
});

test("routes to highest throughput model", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "throughput",
      },
    },
  };
  const routerService = new OpenRouterService(customConfig);
  const app = createServer(routerService);

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    payload: {
      question: "What is the meaning of life?",
    },
  });
  assert.equal(response.statusCode, 200);
  const responseBody = response.json() as LLMResponse;
  assert.equal(responseBody.model, "google/gemma-4-31b-it-20260402:free");
});
