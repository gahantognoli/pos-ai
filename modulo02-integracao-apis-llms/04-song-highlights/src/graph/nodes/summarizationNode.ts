import { HumanMessage } from "langchain";
import type { Runtime } from "@langchain/langgraph";
import { OpenRouterService } from "../../services/openrouterService.ts";
import type { GraphState } from "../graph.ts";
import {
  ConversationSummary,
  getSummarizationSystemPrompt,
  getSummarizationUserPrompt,
  SummarySchema,
} from "../../prompts/v1/summarization.ts";
import { PreferencesService } from "../../services/preferencesService.ts";
import { RemoveMessage } from "@langchain/core/messages";

export function createSummarizationNode(
  llmClient: OpenRouterService,
  preferencesService: PreferencesService,
) {
  return async (
    state: GraphState,
    runtime: Runtime,
  ): Promise<Partial<GraphState>> => {
    const conversationHistory = state.messages.map((message) => ({
      role: HumanMessage.isInstance(message) ? "User" : "AI",
      content: message.text,
    }));

    const previousSummary = state.conversationSummary as
      | ConversationSummary
      | undefined;
    const systemPrompt = getSummarizationSystemPrompt();
    const userPrompt = getSummarizationUserPrompt(
      conversationHistory,
      previousSummary,
    );

    const result = await llmClient.generateStructured<ConversationSummary>(
      systemPrompt,
      userPrompt,
      SummarySchema,
    );

    if (result.error || !result.data) {
      console.error("Error generating summary:", result.error);
      return {
        needsSummarization: false,
      };
    }

    const userId = String(
      runtime?.context?.userId || state.userId || "unknown",
    );

    await preferencesService.storeSummary(userId, result.data);

    const deleteMessage = state.messages.slice(0, -2).map(
      (message) =>
        new RemoveMessage({
          id: message.id as string,
        }),
    );

    return {
      messages: deleteMessage,
      conversationSummary: result.data,
      needsSummarization: false,
    };
  };
}
