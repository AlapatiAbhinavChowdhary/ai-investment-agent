import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
import { newsNode, financialNode, competitorNode, verdictNode } from "./nodes";

export async function runResearchAgent(company: string) {
  const graph = new StateGraph(AgentState)
    .addNode("news", newsNode)
    .addNode("financial", financialNode)
    .addNode("competitor", competitorNode)
    .addNode("judge", verdictNode)
    .addEdge("__start__", "news")
    .addEdge("news", "financial")
    .addEdge("financial", "competitor")
    .addEdge("competitor", "judge")
    .addEdge("judge", "__end__")
    .compile();

  const result = await graph.invoke({
    company,
    newsAnalysis: "",
    financialAnalysis: "",
    competitorAnalysis: "",
    verdict: "",
    confidence: 0,
    reasoning: "",
  });

  return result;
}