import { PromptTemplate } from "@langchain/core/prompts";
import { OpenRouterService } from "../../services/openrouterService.ts";
import type { GraphState } from "../state.ts";
import { prompts } from "../../config.ts";

export const createGuardrailsCheckNode = (
  openRouterService: OpenRouterService,
) => {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      const lastMessage = state.messages.at(-1)?.text ?? "";

      const template = PromptTemplate.fromTemplate(prompts.system);
      const systemPrompt = await template.format({
        USER_ROLE: state.user.role,
        USER_NAME: state.user.displayName,
      });

      const msg = systemPrompt + "\n\n" + lastMessage;
      
      const result = await openRouterService.checkGuardrails(
        msg,
        state.guardrailsEnabled ?? true,
      );

      return {
        guardrailCheck: result,
      };
    } catch (error) {
      console.error("Guardrails check failed:", error);
      return {
        guardrailCheck: {
          reason: "Guardrails check failed due to an error.",
          safe: false,
        },
      };
    }
  };
};
