// Lightweight per-review classifier. Runs async after a review is saved so
// admin moderation has toxicity/spam/sentiment signals to act on.
//
// Falls back gracefully when ANTHROPIC_API_KEY is missing — we just don't enrich.
// Existing rule-based sentiment logic in reviewController stays in place; this
// fills in the richer fields when the model is available.

let Anthropic;
try {
  Anthropic = require("@anthropic-ai/sdk");
} catch {
  Anthropic = null;
}

const Review = require("../Models/Review");
const logger = require("./logger");

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const SYSTEM_PROMPT = `You classify customer product reviews for a luxury streetwear brand.
Respond ONLY with a JSON object of this shape:
{
  "toxicity": <0-100 integer>,
  "spam": <0-100 integer>,
  "sentimentScore": <integer between -100 and 100>,
  "summary": "<one-sentence summary, max 200 chars>"
}
Rules:
- toxicity: 0 = friendly, 100 = abusive/harassing
- spam: 0 = legit, 100 = obvious spam/promo/copy-paste
- sentimentScore: -100 = highly negative, 0 = neutral, 100 = highly positive
- summary: terse, no marketing fluff
Never return prose outside the JSON.`;

const clamp = (n, min, max) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
};

// Tolerant JSON extraction — Claude is instructed to return JSON-only, but we
// still strip any markdown fences / stray prose before parsing.
const extractJson = (text) => {
  let cleaned = String(text || "").trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) cleaned = fenced[1].trim();
  if (!cleaned.startsWith("{")) {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned);
};

const callClassifier = async ({ title, content, rating }) => {
  if (!Anthropic) return null;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const userPrompt = `Rating: ${rating} / 5\nTitle: ${title || "(none)"}\nReview: ${content || ""}`;

  // No temperature/response_format — sampling params are rejected on Claude 4.x.
  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw =
    (message.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("") || "{}";
  let parsed;
  try {
    parsed = extractJson(raw);
  } catch {
    return null;
  }

  return {
    toxicity: clamp(parsed.toxicity, 0, 100),
    spam: clamp(parsed.spam, 0, 100),
    sentimentScore: clamp(parsed.sentimentScore, -100, 100),
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 280) : null,
  };
};

// Fire-and-forget enrichment. Caller awaits review save, then triggers this
// without blocking the HTTP response. Failures are logged but never thrown
// upstream — moderation still works without the AI signal.
const enrichReviewAsync = (reviewId) => {
  setImmediate(async () => {
    try {
      const review = await Review.findById(reviewId).select(
        "title content rating aiAnalysis"
      );
      if (!review) return;
      // Skip re-classification if already analyzed within last 7 days.
      if (
        review.aiAnalysis?.analyzedAt &&
        Date.now() - new Date(review.aiAnalysis.analyzedAt).getTime() <
          7 * 24 * 3600 * 1000
      ) {
        return;
      }

      const result = await callClassifier({
        title: review.title,
        content: review.content,
        rating: review.rating,
      });
      if (!result) return;

      review.aiAnalysis = {
        ...result,
        analyzedAt: new Date(),
        model: DEFAULT_MODEL,
      };
      await review.save({ validateBeforeSave: false });
    } catch (err) {
      logger?.warn?.(
        `[review-classifier] enrichment failed: ${err?.message || err}`
      );
    }
  });
};

module.exports = {
  enrichReviewAsync,
  // Exposed for an admin "rerun classification" button or batch backfill.
  callClassifier,
};
