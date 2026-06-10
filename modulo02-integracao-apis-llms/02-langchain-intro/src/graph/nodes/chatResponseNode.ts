import { AIMessage, SystemMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function chatResponseNode(state: GraphState): GraphState {
  const responseText = state.output;
  const fallbackMessage = new AIMessage(responseText).content.toString();
  return {
    ...state,
    output: fallbackMessage,
    messages: [...state.messages],
  };
}
