import { NextRequest, NextResponse } from "next/server";
import { runResearchAgent } from "@/lib/agent/graph";

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json();

    if (!company || company.trim() === "") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const result = await runResearchAgent(company.trim());

    return NextResponse.json({
      company: result.company,
      verdict: result.verdict,
      confidence: result.confidence,
      reasoning: result.reasoning,
      newsAnalysis: result.newsAnalysis,
      financialAnalysis: result.financialAnalysis,
      competitorAnalysis: result.competitorAnalysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("Research agent error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}