console.assert(
  process.env.OPENROUTER_API_KEY,
  "OPENROUTER_API_KEY is not set in environment variables",
);

export type ModelConfig = {
  apiKey: string;
  httpReferer: string;
  xTitle: string;
  port: number;
  models: string[];
  tempeture: number;
  maxTokens: number;
  systemPrompt: string;

  provider: {
    sort: {
      by: string;
      partition: string;
    }
  }
}

export const config: ModelConfig = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  httpReferer: "http://localhost:3000",
  xTitle: 'Smart Model Router Gateway',
  port: 3000,
  models: [
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'sourceful/riverflow-v2.5-pro:free',
  ],
  tempeture: 0.2,
  maxTokens: 100,
  systemPrompt: "You are a helpful assistant.",
  provider: {
    sort: {
      by: "latency",
      partition: "none"
    }
  }
}