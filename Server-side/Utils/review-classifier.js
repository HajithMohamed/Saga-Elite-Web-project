// Lightweight per-review classifier. Runs async after a review is saved so
// admin moderation has toxicity/spam/sentiment signals to act on.
//
// Falls back gracefully when OPENAI_API_KEY is missing — we just don't enrich.
// Existing rule-based sentiment logic in reviewController stays in place; this
// fills in the richer fields when the model is available.

let OpenAI;
try {
  OpenAI = require("openai");
} catch {
  OpenAI = null;
}

const Review = require("../Models/Review");
const logger = require("./logger");

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

const callClassifier = async ({ title, content, rating }) => {
  if (!OpenAI) return null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const userPrompt = `Rating: ${rating} / 5\nTitle: ${title || "(none)"}\nReview: ${content || ""}`;

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
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
