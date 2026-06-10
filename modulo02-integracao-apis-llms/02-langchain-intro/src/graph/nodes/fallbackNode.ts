import { AIMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function fallbackNode(state: GraphState): GraphState {
  const message =
    "Unknown command. Please use 'upper' or 'lower' in your input.";
  const fallbackMessage = new AIMessage(message);
  return {
    ...state,
    output: message,
    messages: [...state.messages, fallbackMessage],
  };
}
