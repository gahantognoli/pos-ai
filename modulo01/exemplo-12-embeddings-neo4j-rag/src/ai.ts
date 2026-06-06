import { type Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

type DebugLog = (...args: unknown[]) => void;
type params = {
  debugLog: DebugLog,
  vectorStore: Neo4jVectorStore,
  nlpModel: ChatOpenAI,
  promptConfig: any,
  templateText: string,
  topK: number
}

interface ChainState {
  question: string;
  context?: string;
  topScore?: number;
  error?: string;
  answer?: string;
}

export class AI {
  private params: params

  constructor(params: params) {
    this.params = params
  }

  async retriveVectorSearchResults(input: ChainState): Promise<ChainState> {
    this.params.debugLog("🔍 Realizando busca vetorial para a pergunta:", input.question);
    const vectorResults = await this.params.vectorStore.similaritySearchWithScore(
      input.question,
      this.params.topK
    )

    if (!vectorResults.length) {
      this.params.debugLog("⚠️ Nenhum resultado encontrado para a pergunta:", input.question);
      return {
        ...input,
        error: "Desculpe, não consegui encontrar informações relevantes para responder à sua pergunta."
      }
    }

    const topScore = vectorResults[0]![1]
    this.params.debugLog(`✅ Encontrados ${vectorResults.length} resultados relevantes. Top score: ${topScore.toFixed(4)}`);

    const contexts = vectorResults
      .filter(([_, score]) => score >= 0.5)
      .map(([doc]) => doc.pageContent)
      .join("\n---\n")

    return {
      ...input,
      context: contexts,
      topScore
    }
  }

  async generateNLPResponse(input: ChainState): Promise<ChainState> {
    if (input.error) return input

    this.params.debugLog("🤖 Gerando resposta usando o modelo NLP para a pergunta:", input.question);

    const responsePrompt = ChatPromptTemplate.fromTemplate(this.params.templateText)

    const responseChain = responsePrompt
      .pipe(this.params.nlpModel)
      .pipe(new StringOutputParser())

    const rawResponse = await responseChain.invoke({
      role: this.params.promptConfig.role,
      task: this.params.promptConfig.task,
      tone: this.params.promptConfig.tone,
      language: this.params.promptConfig.language,
      format: this.params.promptConfig.format,
      instructions: this.params.promptConfig.instructions
        .map((instruction: string, idx: number) => `${idx + 1}. ${instruction}`).join("\n"),
      question: input.question,
      context: input.context
    })

    return {
      ...input,
      answer: rawResponse
    }
  }

  async anwserQuestion(question: string) {
    const chain = RunnableSequence.from([
      this.retriveVectorSearchResults.bind(this),
      this.generateNLPResponse.bind(this),
    ])
    
    const result = await chain.invoke({
      question
    })

    this.params.debugLog("📌 RESPOSTA:", result.answer);
    this.params.debugLog("📌 ERRO:", result.error);

    return result
  }
}