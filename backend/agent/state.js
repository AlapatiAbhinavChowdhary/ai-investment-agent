const { Annotation } = require("@langchain/langgraph");

const AgentState = Annotation.Root({
  company: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  newsAnalysis: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  financialAnalysis: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  competitorAnalysis: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  verdict: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
  confidence: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => 0,
  }),
  reasoning: Annotation({
    reducer: (a, b) => b ?? a,
    default: () => "",
  }),
});

module.exports = { AgentState };
