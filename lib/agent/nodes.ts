import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { AgentStateType } from "./state";
import { fetchNewsHeadlines, fetchFinancialData, fetchCompetitorData } from "./tools";

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

let llm: ChatGoogleGenerativeAI | null = null;

function readKeyFromEnvFile(name: string) {
  const envPath = join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return undefined;
  }

  const contents = readFileSync(envPath, "utf8");
  const line = contents
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));

  if (!line) {
    return undefined;
  }

  return line.slice(name.length + 1).replace(/^['\"]|['\"]$/g, "");
}

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    readKeyFromEnvFile("GEMINI_API_KEY") ||
    readKeyFromEnvFile("GOOGLE_API_KEY")
  );
}

function getLLM() {
  if (!llm) {
    llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: getApiKey(),
      temperature: 0.3,
    });
  }

  return llm;
}

export async function newsNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const llm = getLLM();

  try {
    const rawNews = await fetchNewsHeadlines(state.company);

    const response = await llm.invoke([
      {
        role: "user",
        content: `You are a financial news analyst. Analyze these recent headlines about ${state.company} and summarize the news sentiment (positive/negative/neutral) and key events. Be concise.

Headlines:
${rawNews}

Provide a 3-4 sentence analysis.`
      }
    ]);

    return { newsAnalysis: response.content as string };
  } catch (error) {
    console.error("newsNode error:", error);
    return { newsAnalysis: "Unable to analyze news at this time." };
  }
}

export async function financialNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const llm = getLLM();

  try {
    const rawData = await fetchFinancialData(state.company);

    const response = await llm.invoke([
      {
        role: "user",
        content: `You are a financial analyst. Based on these financial news items about ${state.company}, assess the company's financial health. Look for revenue trends, profitability, debt concerns.

Data:
${rawData}

Provide a 3-4 sentence financial assessment.`
      }
    ]);

    return { financialAnalysis: response.content as string };
  } catch (error) {
    console.error("financialNode error:", error);
    return { financialAnalysis: "Unable to analyze financial data at this time." };
  }
}

export async function competitorNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const llm = getLLM();

  try {
    const rawData = await fetchCompetitorData(state.company);

    const response = await llm.invoke([
      {
        role: "user",
        content: `You are a market analyst. Based on these items about ${state.company} and its competitors, assess its competitive position and market standing.

Data:
${rawData}

Provide a 3-4 sentence competitive analysis.`
      }
    ]);

    return { competitorAnalysis: response.content as string };
  } catch (error) {
    console.error("competitorNode error:", error);
    return { competitorAnalysis: "Unable to analyze competitors at this time." };
  }
}

export async function verdictNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    const llm = getLLM();
    const response = await llm.invoke([
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

    const text = response.content as string;
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