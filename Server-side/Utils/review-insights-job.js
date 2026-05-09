let cron = null;
try {
  cron = require("node-cron");
} catch (_error) {
  console.warn("[review-insights-job] node-cron is not installed; scheduler disabled.");
}

let OpenAI = null;
try {
  OpenAI = require("openai");
} catch (_error) {
  console.warn("[review-insights-job] openai package is not installed; analysis disabled.");
}

const Review = require("../Models/Review");
const ReviewInsight = require("../Models/ReviewInsight");

const ANALYSIS_WINDOW_DAYS = 90;
const MAX_REVIEWS_PER_RUN = 300;
const MIN_REVIEWS_TO_ANALYZE = 5;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a senior CX and product analyst for a luxury fashion e-commerce brand.
You will receive an array of customer reviews. Analyse them holistically and produce a JSON report
that identifies recurring issues, the most actionable improvements the brand should make, and
notable trends. Be concrete, prioritise high-impact items, and avoid generic advice.

You MUST respond with a single valid JSON object that exactly matches this schema:
{
  "summary": "string — 2 to 4 sentences summarising overall customer sentiment",
  "topIssues": [
    {
      "category": "fit | quality | delivery | style | value | uncategorized",
      "issue": "string — concise description of the recurring issue",
      "frequency": "integer — number of reviews mentioning this issue",
      "severity": "high | medium | low",
      "exampleReviewIds": ["string review id from the input data"]
    }
  ],
  "recommendations": [
    {
      "area": "string — short label e.g. 'Sizing chart', 'Logistics partner'",
      "action": "string — concrete action the team should take",
      "priority": "high | medium | low",
      "expectedImpact": "string — what improves if this is done"
    }
  ],
  "trendsObserved": "string — 2 to 4 sentences on patterns over time, categories, or rating shifts"
}

Limit topIssues to the 6 most important. Limit recommendations to the 6 most impactful.`;

const buildUserPrompt = (reviews, { truncated, totalAvailable }) => {
  const sample = reviews.map((r) => ({
    id: String(r._id),
    rating: r.rating,
    title: r.title,
    content: r.content,
    category: r.category,
    sentiment: r.sentiment,
    createdAt: r.createdAt,
  }));

  const note = truncated
    ? `Note: only the most recent ${reviews.length} of ${totalAvailable} approved reviews are shown (truncated for token budget).`
    : `All ${reviews.length} approved reviews from the analysis window are shown.`;

  return `${note}\n\nReviews:\n${JSON.stringify(sample, null, 2)}`;
};

const generateReviewInsights = async () => {
  if (!OpenAI) {
    throw new Error("OpenAI SDK is not installed.");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ANALYSIS_WINDOW_DAYS);

  const totalAvailable = await Review.countDocuments({
    status: "approved",
    createdAt: { $gte: cutoff },
  });

  if (totalAvailable < MIN_REVIEWS_TO_ANALYZE) {
    console.log(
      `[review-insights-job] Only ${totalAvailable} approved reviews in the last ${ANALYSIS_WINDOW_DAYS} days; minimum ${MIN_REVIEWS_TO_ANALYZE} required. Skipping.`
    );
    return null;
  }

  const reviews = await Review.find({
    status: "approved",
    createdAt: { $gte: cutoff },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_REVIEWS_PER_RUN)
    .select("_id rating title content category sentiment createdAt")
    .lean();

  const truncated = totalAvailable > reviews.length;
  const dateRange = {
    from: reviews[reviews.length - 1]?.createdAt || cutoff,
    to: reviews[0]?.createdAt || new Date(),
  };

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(reviews, { truncated, totalAvailable }) },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`OpenAI returned invalid JSON: ${err.message}`);
  }

  const allowedCategories = ["fit", "quality", "delivery", "style", "value", "uncategorized"];
  const allowedSeverities = ["high", "medium", "low"];

  const topIssues = Array.isArray(parsed.topIssues)
    ? parsed.topIssues.slice(0, 10).map((entry) => ({
        category: allowedCategories.includes(entry.category) ? entry.category : "uncategorized",
        issue: String(entry.issue || "").trim(),
        frequency: Number(entry.frequency) || 0,
        severity: allowedSeverities.includes(entry.severity) ? entry.severity : "medium",
        exampleReviewIds: Array.isArray(entry.exampleReviewIds)
          ? entry.exampleReviewIds.filter((id) => /^[a-f0-9]{24}$/i.test(String(id))).slice(0, 5)
          : [],
      }))
    : [];

  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.slice(0, 10).map((entry) => ({
        area: String(entry.area || "").trim(),
        action: String(entry.action || "").trim(),
        priority: allowedSeverities.includes(entry.priority) ? entry.priority : "medium",
        expectedImpact: String(entry.expectedImpact || "").trim(),
      }))
    : [];

  const insight = await ReviewInsight.create({
    generatedAt: new Date(),
    totalReviewsAnalyzed: reviews.length,
    dateRange,
    summary: String(parsed.summary || "").trim(),
    topIssues,
    recommendations,
    trendsObserved: String(parsed.trendsObserved || "").trim(),
    model: DEFAULT_MODEL,
    tokensUsed: completion.usage?.total_tokens || 0,
  });

  console.log(
    `[review-insights-job] Generated insight ${insight._id} from ${reviews.length} reviews (${completion.usage?.total_tokens || 0} tokens).`
  );

  return insight;
};

const runDailyJob = async () => {
  try {
    await generateReviewInsights();
  } catch (err) {
    console.error("[review-insights-job] Daily run failed:", err.message);
  }
};

const initReviewInsightsJob = () => {
  if (!cron) return;
  cron.schedule("0 3 * * *", runDailyJob);
  console.log("[review-insights-job] Scheduled daily run at 03:00 server time.");
};

module.exports = { initReviewInsightsJob, generateReviewInsights };
