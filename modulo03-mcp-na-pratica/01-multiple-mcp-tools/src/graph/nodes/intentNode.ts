import { AIMessage } from "langchain";
import { OpenRouterService } from "../../services/openRouterService.ts";
import type { GraphState } from "../state.ts";
import {
  getSystemPrompt,
  type IntentData,
  IntentSchema,
} from "../../prompts/v1/identifyIntent.ts";

export function intentNode(openRouterService: OpenRouterService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log("🧠 Intent node processing...");
    try {
      const rawQuestion = state.messages.at(-1)!.text as string;
      const systemPrompt = getSystemPrompt();
      const result = await openRouterService.generateStructured(
        systemPrompt,
        rawQuestion,
        IntentSchema,
      );

      const parsed = result.data as IntentData;
      if (!parsed.intent || !parsed.fileType) {
        console.log(
          "Intent node: No intent or fileType found in the parsed result:",
          parsed,
        );
        throw new Error("No intent or fileType found in the parsed result");
      }

      parsed.fileName ??= `data.${parsed.fileType}`;
      console.log("Intent node: Parsed result:", parsed);

      return {
        intent: parsed.intent,
        fileContent: parsed.fileContent ?? "",
        fileName: parsed.fileName,
      };
    } catch (error) {
      console.error("Intent node error:", error);
      return {
        messages: [
          new AIMessage(
            "Sorry, I had trouble understanding the intent. Please rephrase your question or provide more details.",
          ),
        ],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}
