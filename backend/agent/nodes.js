const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { fetchNewsHeadlines, fetchFinancialData, fetchCompetitorData } = require("./tools");

let llm = null;

function getLLM() {
  if (!llm) {
    llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
    });
  }
  return llm;
}

async function invokeWithRetry(llm, messages, options) {
  const maxAttempts = 5;
  let attempt = 0;
  let delay = 1000;

  while (true) {
    try {
      return await llm.invoke(messages, options);
    } catch (error) {
      attempt++;
      const errorStr = String(error);
      const is429 =
        error?.status === 429 ||
        error?.statusCode === 429 ||
        errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED") ||
        errorStr.includes("rate limit") ||
        (error?.message && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED")));

      if (is429 && attempt < maxAttempts) {
        console.warn(`[Retry] Attempt ${attempt} failed with 429 (Too Many Requests). Retrying in ${delay}ms...`, error?.message || errorStr);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
}

async function newsNode(state) {
  const llm = getLLM();

  try {
    const rawNews = await fetchNewsHeadlines(state.company);

    const response = await invokeWithRetry(llm, [
      {
        role: "user",
        content: `You are a financial news analyst. Analyze these recent headlines about ${state.company} and summarize the news sentiment (positive/negative/neutral) and key events. Be concise.

Headlines:
${rawNews}

Provide a 3-4 sentence analysis.`
      }
    ]);

    return { newsAnalysis: response.content };
  } catch (error) {
    console.error("newsNode error:", error);
    return { newsAnalysis: "Unable to analyze news at this time." };
  }
}

async function financialNode(state) {
  const llm = getLLM();

  try {
    const rawData = await fetchFinancialData(state.company);

    const response = await invokeWithRetry(llm, [
      {
        role: "user",
        content: `You are a financial analyst. Based on these financial news items about ${state.company}, assess the company's financial health. Look for revenue trends, profitability, debt concerns.

Data:
${rawData}

Provide a 3-4 sentence financial assessment.`
      }
    ]);

    return { financialAnalysis: response.content };
  } catch (error) {
    console.error("financialNode error:", error);
    return { financialAnalysis: "Unable to analyze financial data at this time." };
  }
}

async function competitorNode(state) {
  const llm = getLLM();

  try {
    const rawData = await fetchCompetitorData(state.company);

    const response = await invokeWithRetry(llm, [
      {
        role: "user",
        content: `You are a market analyst. Based on these items about ${state.company} and its competitors, assess its competitive position and market standing.

Data:
${rawData}

Provide a 3-4 sentence competitive analysis.`
      }
    ]);

    return { competitorAnalysis: response.content };
  } catch (error) {
    console.error("competitorNode error:", error);
    return { competitorAnalysis: "Unable to analyze competitors at this time." };
  }
}

async function verdictNode(state) {
  try {
    const llm = getLLM();
    const response = await invokeWithRetry(llm, [
      {
        role: "user",
        content: `You are a senior investment analyst. Based on the following research about ${state.company}, make a final investment decision.

NEWS ANALYSIS:
${state.newsAnalysis}

FINANCIAL ANALYSIS:
${state.financialAnalysis}

COMPETITOR ANALYSIS:
${state.competitorAnalysis}

Respond in this exact JSON format:
{
  "verdict": "INVEST" or "PASS",
  "confidence": <number between 0 and 100>,
  "reasoning": "<2-3 sentences explaining the decision>"
}`
      }
    ]);

    const text = response.content;
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      verdict: json.verdict,
      confidence: json.confidence,
      reasoning: json.reasoning,
    };
  } catch (error) {
    console.error("verdictNode error:", error);
    return {
      verdict: "PASS",
      confidence: 50,
      reasoning: "Unable to generate a verdict at this time.",
    };
  }
}

module.exports = { newsNode, financialNode, competitorNode, verdictNode };
