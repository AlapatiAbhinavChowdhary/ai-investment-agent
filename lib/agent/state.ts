import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  company: Annotation<string>({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  newsAnalysis: Annotation<string>({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  financialAnalysis: Annotation<string>({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  competitorAnalysis: Annotation<string>({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  verdict: Annotation<string>({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  confidence: Annotation<number>({
    reducer: (a, b) => b ?? a,
    default: () => 0,
  }),
  reasoning: Annotation<string>({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
});

export type AgentStateType = typeof AgentState.State;