const axios = require("axios");
const cheerio = require("cheerio");

async function fetchNewsHeadlines(company) {
  try {
    const query = encodeURIComponent(`${company} stock news investment 2024`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await axios.get(url, { timeout: 8000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const headlines = [];
    $("item title").each((i, el) => {
      if (i < 8) headlines.push($(el).text());
    });

    return headlines.join("\n") || "No recent news found";
  } catch (error) {
    return "Could not fetch news at this time";
  }
}

async function fetchFinancialData(company) {
  try {
    const query = encodeURIComponent(`${company} annual revenue profit loss financial results`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await axios.get(url, { timeout: 8000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const items = [];
    $("item title").each((i, el) => {
      if (i < 6) items.push($(el).text());
    });

    return items.join("\n") || "No financial data found";
  } catch (error) {
    return "Could not fetch financial data at this time";
  }
}

async function fetchCompetitorData(company) {
  try {
    const query = encodeURIComponent(`${company} vs competitors market share industry 2024`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await axios.get(url, { timeout: 8000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const items = [];
    $("item title").each((i, el) => {
      if (i < 6) items.push($(el).text());
    });

    return items.join("\n") || "No competitor data found";
  } catch (error) {
    return "Could not fetch competitor data at this time";
  }
}

module.exports = { fetchNewsHeadlines, fetchFinancialData, fetchCompetitorData };
