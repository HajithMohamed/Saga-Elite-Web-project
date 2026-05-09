/*
 * One-shot migration: copy existing ReviewInsight documents into the unified
 * Recommendation collection with type="reviews". Safe to re-run; uses generatedAt
 * as an idempotency key to avoid duplicates.
 *
 * Usage: node scripts/migrate-review-insights.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectToDB = require("../DataBase/db");
const ReviewInsight = require("../Models/ReviewInsight");
const Recommendation = require("../Models/Recommendation");

const run = async () => {
  await connectToDB();

  const insights = await ReviewInsight.find().lean();
  console.log(`Found ${insights.length} ReviewInsight documents to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const insight of insights) {
    const exists = await Recommendation.findOne({
      type: "reviews",
      generatedAt: insight.generatedAt,
    }).lean();
    if (exists) {
      skipped += 1;
      continue;
    }

    const items = (insight.topIssues || []).map((issue) => ({
      title: issue.issue,
      detail: "",
      severity: issue.severity,
      frequency: issue.frequency,
      category: issue.category,
      refIds: issue.exampleReviewIds || [],
    }));

    await Recommendation.create({
      type: "reviews",
      generatedAt: insight.generatedAt,
      summary: insight.summary,
      items,
      recommendations: (insight.recommendations || []).map((rec) => ({
        area: rec.area,
        action: rec.action,
        priority: rec.priority,
        expectedImpact: rec.expectedImpact,
        supportingData: "",
      })),
      trendsObserved: insight.trendsObserved,
      dataSnapshot: {
        totalReviewsAnalyzed: insight.totalReviewsAnalyzed,
        dateRange: insight.dateRange,
      },
      model: insight.model,
      tokensUsed: insight.tokensUsed,
    });
    migrated += 1;
  }

  console.log(`Migrated: ${migrated}. Skipped (already present): ${skipped}.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
