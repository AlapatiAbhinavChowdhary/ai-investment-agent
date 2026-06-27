const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { runResearchAgent } = require("./agent/graph");

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/research — Run the AI research agent for a company
app.post("/api/research", async (req, res) => {
  try {
    const { company } = req.body;

    if (!company || company.trim() === "") {
      return res.status(400).json({ error: "Company name is required" });
    }

    const result = await runResearchAgent(company.trim());

    return res.json({
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
    return res.status(500).json({ error: message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start Server ────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
