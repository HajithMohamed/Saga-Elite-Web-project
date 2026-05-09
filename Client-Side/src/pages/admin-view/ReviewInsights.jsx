import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import {
  fetchReviewInsights,
  regenerateReviewInsights,
} from "@/store/reviewSlice";
import { toast } from "@/hooks/use-toast";
import { AdminPage, AdminPanel, AdminStatCard } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";

const SEVERITY_STYLES = {
  high: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const CATEGORY_LABELS = {
  fit: "Fit",
  quality: "Quality",
  delivery: "Delivery",
  style: "Style",
  value: "Value",
  uncategorized: "General",
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

const formatDateOnly = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
};

const ReviewInsights = () => {
  const dispatch = useDispatch();
  const { insights, insightsLoading, insightsRegenerating, insightsError } =
    useSelector((state) => state.review);

  useEffect(() => {
    dispatch(fetchReviewInsights());
  }, [dispatch]);

  const handleRegenerate = async () => {
    const result = await dispatch(regenerateReviewInsights());
    if (regenerateReviewInsights.fulfilled.match(result)) {
      toast({
        title: "Insights generated",
        description: "Latest customer review insights are ready.",
        variant: "success",
      });
    } else {
      toast({
        title: "Could not generate insights",
        description: result.payload || "Try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const sortedRecommendations = React.useMemo(() => {
    if (!insights?.recommendations) return [];
    return [...insights.recommendations].sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    );
  }, [insights]);

  const sortedIssues = React.useMemo(() => {
    if (!insights?.topIssues) return [];
    return [...insights.topIssues].sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
  }, [insights]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AdminPage
        eyebrow="Customers"
        title="AI-Powered Review Insights"
        description="Aggregate analysis of customer reviews — recurring issues and recommended improvements, refreshed daily."
        actions={
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={insightsRegenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#f2ca50] transition hover:bg-[#f2ca50]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {insightsRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {insightsRegenerating ? "Analyzing…" : "Regenerate now"}
          </button>
        }
      >
        {insightsLoading && !insights ? (
          <AdminPanel>
            <div className="flex items-center gap-3 text-[#99907c]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading insights…
            </div>
          </AdminPanel>
        ) : !insights ? (
          <AdminPanel>
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Sparkles className="h-10 w-10 text-[#f2ca50]" />
              <h3 className="text-lg font-bold text-[#e5e2e1]">No insights yet</h3>
              <p className="max-w-md text-sm text-[#99907c]">
                Insights are generated automatically every day at 03:00 server time, or you can
                trigger one now if there are at least 5 approved reviews from the last 90 days.
              </p>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={insightsRegenerating}
                className="inline-flex items-center gap-2 rounded-lg border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#f2ca50] transition hover:bg-[#f2ca50]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {insightsRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {insightsRegenerating ? "Analyzing…" : "Generate now"}
              </button>
              {insightsError ? (
                <p className="text-xs text-rose-300">{insightsError}</p>
              ) : null}
            </div>
          </AdminPanel>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminStatCard
                label="Reviews Analyzed"
                value={insights.totalReviewsAnalyzed}
                hint={`From ${formatDateOnly(insights.dateRange?.from)} to ${formatDateOnly(insights.dateRange?.to)}`}
                icon={FileText}
              />
              <AdminStatCard
                label="Top Issues Found"
                value={sortedIssues.length}
                hint="Recurring concerns from customers"
                icon={AlertTriangle}
              />
              <AdminStatCard
                label="Last Generated"
                value={formatDate(insights.generatedAt)}
                hint={`Model: ${insights.model || "—"}`}
                icon={Calendar}
              />
            </div>

            {insights.summary ? (
              <AdminPanel
                title="Overall sentiment"
                description="What customers are telling us, in one paragraph."
              >
                <p className="text-sm leading-relaxed text-[#e5e2e1]">{insights.summary}</p>
              </AdminPanel>
            ) : null}

            <AdminPanel
              title="Top recurring issues"
              description="The most frequently raised customer concerns, ranked by how often they appear."
            >
              {sortedIssues.length === 0 ? (
                <p className="text-sm text-[#99907c]">No recurring issues detected.</p>
              ) : (
                <ul className="space-y-3">
                  {sortedIssues.map((issue, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-[#4d4635]/60 bg-[#0a0a0a] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">
                              {CATEGORY_LABELS[issue.category] || issue.category}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium
                              }`}
                            >
                              {issue.severity} severity
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#e5e2e1]">{issue.issue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-[#99907c]">Mentions</p>
                          <p className="text-2xl font-bold text-[#f2ca50]">{issue.frequency}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>

            <AdminPanel
              title="Recommended improvements"
              description="Concrete actions ranked by priority. Use these to drive your next sprint."
            >
              {sortedRecommendations.length === 0 ? (
                <p className="text-sm text-[#99907c]">No recommendations available.</p>
              ) : (
                <ul className="space-y-3">
                  {sortedRecommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-[#4d4635]/60 bg-[#0a0a0a] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#f2ca50]" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-[#e5e2e1]">
                              {rec.area}
                            </h4>
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                SEVERITY_STYLES[rec.priority] || SEVERITY_STYLES.medium
                              }`}
                            >
                              {rec.priority} priority
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#e5e2e1]">{rec.action}</p>
                          {rec.expectedImpact ? (
                            <p className="mt-2 text-xs italic text-[#99907c]">
                              Expected impact: {rec.expectedImpact}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>

            {insights.trendsObserved ? (
              <AdminPanel
                title="Trends observed"
                description="Patterns over time, across categories, or in customer mood."
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#f2ca50]" />
                  <p className="text-sm leading-relaxed text-[#e5e2e1]">
                    {insights.trendsObserved}
                  </p>
                </div>
              </AdminPanel>
            ) : null}

            <p className="text-center text-xs text-[#4d4635]">
              Generated by {insights.model || "AI"} · {insights.tokensUsed || 0} tokens used
            </p>
          </div>
        )}
      </AdminPage>
    </motion.div>
  );
};

export default ReviewInsights;
