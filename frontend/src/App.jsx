import { useEffect, useState } from "react";
import axios from "axios";

const SEARCH_HISTORY_KEY = "ai-investment-research-history";

const LOADING_STEPS = [
  "Fetching latest news...",
  "Analyzing financials...",
  "Scanning competitors...",
  "Generating verdict...",
];

const ANALYSIS_CARDS = [
  {
    key: "news",
    title: "News Analysis",
    accentClass: "border-sky-500/60",
    dotClass: "bg-sky-400",
    contentKey: "newsAnalysis",
  },
  {
    key: "financial",
    title: "Financial Analysis",
    accentClass: "border-amber-500/60",
    dotClass: "bg-amber-400",
    contentKey: "financialAnalysis",
  },
  {
    key: "competitor",
    title: "Competitor Analysis",
    accentClass: "border-rose-500/60",
    dotClass: "bg-rose-400",
    contentKey: "competitorAnalysis",
  },
];

const INITIAL_ANALYSIS_OPEN = {
  news: false,
  financial: false,
  competitor: false,
};

export default function App() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingStage, setLoadingStage] = useState(0);
  const [researchCompletedAt, setResearchCompletedAt] = useState("");
  const [confidenceProgress, setConfidenceProgress] = useState(0);
  const [analysisOpen, setAnalysisOpen] = useState(INITIAL_ANALYSIS_OPEN);
  const [retryMessage, setRetryMessage] = useState("");

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!storedHistory) return;

      const parsedHistory = JSON.parse(storedHistory);
      if (Array.isArray(parsedHistory)) {
        setSearchHistory(
          parsedHistory
            .filter((entry) => typeof entry === "string" && entry.trim())
            .slice(0, 5)
        );
      }
    } catch {
      setSearchHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }

    setLoadingStage(0);
    const timer = window.setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, LOADING_STEPS.length - 1));
    }, 2000);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!result) {
      setConfidenceProgress(0);
      setAnalysisOpen(INITIAL_ANALYSIS_OPEN);
      return;
    }

    setConfidenceProgress(0);
    const frame = window.requestAnimationFrame(() => {
      setConfidenceProgress(result.confidence);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  function saveSearchToHistory(searchTerm) {
    setSearchHistory((currentHistory) => {
      const normalizedTerm = searchTerm.trim();
      if (!normalizedTerm) return currentHistory;

      const nextHistory = [
        normalizedTerm,
        ...currentHistory.filter((entry) => entry.toLowerCase() !== normalizedTerm.toLowerCase()),
      ].slice(0, 5);

      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
      return nextHistory;
    });
  }

  async function handleResearch() {
    const trimmedCompany = company.trim();
    if (!trimmedCompany) return;

    saveSearchToHistory(trimmedCompany);
    setLoading(true);
    setError("");
    setResult(null);
    setResearchCompletedAt("");
    setConfidenceProgress(0);
    setAnalysisOpen(INITIAL_ANALYSIS_OPEN);
    setRetryMessage("");

    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          setRetryMessage(`Backend is starting up... Retrying (Attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        const res = await axios.post("/api/research", { company: trimmedCompany });
        setResult(res.data);
        setResearchCompletedAt(new Date().toLocaleString());
        setRetryMessage("");
        setLoading(false);
        return;
      } catch (err) {
        attempt++;
        const isStartupError =
          !err.response ||
          err.response.status === 502 ||
          err.response.status === 504 ||
          err.code === "ERR_NETWORK";

        if (isStartupError && attempt <= maxRetries) {
          continue;
        }

        setError(err.response?.data?.error || err.message || "Something went wrong");
        setRetryMessage("");
        setLoading(false);
        return;
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex-1">

          {/* Header */}
          <div className="mb-10 rounded-3xl border border-white/5 bg-white/[0.03] px-5 py-7 text-center shadow-2xl shadow-black/20 backdrop-blur-sm sm:px-8">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.8)]" />
              </span>
              <h1 className="bg-gradient-to-r from-white via-sky-200 to-emerald-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                AI Investment Research Agent
              </h1>
            </div>
            <p className="text-sm text-gray-400 sm:text-base">
              Powered by LangGraph + Gemini · Enter a company to get an invest or pass verdict
            </p>
          </div>

          {/* Input */}
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                placeholder="e.g. Reliance Industries, Tesla, Infosys..."
                className="flex-1 rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                onClick={handleResearch}
                disabled={loading || !company.trim()}
                className="rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Researching..." : "Research"}
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-gray-500">
                Recent searches
              </p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.length > 0 ? (
                  searchHistory.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCompany(item)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-white"
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Your recent companies will appear here.</p>
                )}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mb-8 rounded-3xl border border-white/10 bg-gray-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                    Live research
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {retryMessage || "Running 3 research agents in parallel"}
                  </p>
                </div>
                <div className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.65)] animate-pulse" />
              </div>

              <div className="space-y-3">
                {LOADING_STEPS.map((step, index) => {
                  const status =
                    loadingStage > index ? "done" : loadingStage === index ? "active" : "pending";

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
                        status === "done"
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
                          : status === "active"
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-100"
                            : "border-white/5 bg-white/[0.02] text-gray-400"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          status === "done"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : status === "active"
                              ? "bg-sky-500/20 text-sky-200"
                              : "bg-white/5 text-gray-500"
                        }`}
                      >
                        {status === "done" ? "✓" : index + 1}
                      </span>
                      <div className="flex-1">
                        <p className={`font-medium ${status === "pending" ? "text-gray-400" : "text-white"}`}>
                          {step}
                        </p>
                        <p className="text-xs text-gray-500">
                          {status === "done"
                            ? "Complete"
                            : status === "active"
                              ? "In progress"
                              : "Waiting"}
                        </p>
                      </div>
                      {status === "active" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.8)] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-8 rounded-3xl border border-red-500/30 bg-red-950/50 p-4 text-red-200 shadow-lg shadow-red-950/20">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div key={`${result.company}-${researchCompletedAt}`} className="space-y-4" style={{ animation: "resultEnter 0.45s ease-out" }}>

              {/* Verdict Card */}
              <div
                className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-sm transition-all duration-300 ${
                  result.verdict === "INVEST"
                    ? "border-emerald-500/30 bg-emerald-950/55"
                    : "border-rose-500/30 bg-rose-950/55"
                }`}
                style={{
                  boxShadow:
                    result.verdict === "INVEST"
                      ? "0 0 0 1px rgba(16,185,129,0.16), 0 24px 80px rgba(16,185,129,0.16)"
                      : "0 0 0 1px rgba(244,63,94,0.16), 0 24px 80px rgba(244,63,94,0.16)",
                }}
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-gray-400">
                      Verdict
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{result.company}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold tracking-wide ${
                      result.verdict === "INVEST"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {result.verdict === "INVEST" ? "✅ INVEST" : "❌ PASS"}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-sm text-gray-400">
                    <span>Confidence</span>
                    <span>{confidenceProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/8">
                    <div
                      className={`h-2 rounded-full transition-[width] duration-1000 ease-out ${
                        result.verdict === "INVEST" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${confidenceProgress}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-200">{result.reasoning}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">
                  Research completed {researchCompletedAt}
                </p>
              </div>

              {/* Analysis Cards */}
              <div className="space-y-4">
                {ANALYSIS_CARDS.map((card) => {
                  const isOpen = analysisOpen[card.key];

                  return (
                    <div
                      key={card.key}
                      className={`rounded-3xl border border-white/10 bg-gray-900/70 px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${card.accentClass}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setAnalysisOpen((current) => ({
                            ...current,
                            [card.key]: !current[card.key],
                          }))
                        }
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${card.dotClass}`} />
                          <h3 className="font-semibold text-gray-100">{card.title}</h3>
                        </div>
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                          {isOpen ? "Collapse" : "Expand"}
                        </span>
                      </button>

                      <div
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{
                          maxHeight: isOpen ? 420 : 0,
                          opacity: isOpen ? 1 : 0,
                          marginTop: isOpen ? 12 : 0,
                        }}
                      >
                        <p className="text-sm leading-relaxed text-gray-400">{result[card.contentKey]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        <footer className="mt-4 pb-2 text-center text-xs text-gray-500">
          Powered by LangGraph + Gemini · Built for InsideIIM Assignment
        </footer>
      </div>
    </main>
  );
}
