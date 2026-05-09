import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  Loader2,
  MessageSquare,
  Package,
  Layers,
  BarChart3,
  Wrench,
  Rocket,
} from "lucide-react";
import {
  fetchAllRecommendations,
  fetchRecommendation,
  regenerateRecommendation,
} from "@/store/recommendationsSlice";
import { toast } from "@/hooks/use-toast";
import {
  AdminPage,
  AdminPanel,
  AdminStatCard,
} from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";

const TABS = [
  { key: "reviews", label: "Reviews", icon: MessageSquare },
  { key: "products", label: "Products", icon: Package },
  { key: "drops", label: "Drops", icon: Layers },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "improvements", label: "Improvements", icon: Wrench },
  { key: "ideas", label: "Ideas", icon: Rocket },
];

const TAB_DESCRIPTIONS = {
  reviews: "Recurring issues from customer reviews and how to address them.",
  products: "Catalog moves: which products to promote, retire, restock, or rework.",
  drops: "Strategy for the next drop — timing, theme, sizing, pricing.",
  analytics: "KPIs that need attention this period, with concrete actions.",
  improvements: "Operational fixes to reduce friction and lift retention.",
  ideas: "Creative ideas for new products, channels, and growth.",
};

const SEVERITY_STYLES = {
  high: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const ConfidenceBadge = ({ value }) => {
  if (typeof value !== "number") return null;
  const tone =
    value >= 75
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : value >= 50
      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
      : "border-rose-400/40 bg-rose-400/10 text-rose-300";
  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
      title="AI confidence"
    >
      {value}% conf
    </span>
  );
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

const TabContent = ({ type }) => {
  const dispatch = useDispatch();
  const recommendation = useSelector((state) => state.recommendations.byType[type]);
  const loading = useSelector((state) => state.recommendations.loadingByType[type]);
  const regenerating = useSelector((state) => state.recommendations.regeneratingByType[type]);
  const error = useSelector((state) => state.recommendations.errorByType[type]);

  const handleRegenerate = async () => {
    const result = await dispatch(regenerateRecommendation(type));
    if (regenerateRecommendation.fulfilled.match(result)) {
      toast({
        title: "Recommendation generated",
        description: `Fresh ${type} insights are ready.`,
        variant: "success",
      });
    } else {
      toast({
        title: "Could not generate",
        description: result.payload?.message || "Try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const sortedItems = React.useMemo(() => {
    if (!recommendation?.items) return [];
    return [...recommendation.items].sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
  }, [recommendation]);

  const sortedRecs = React.useMemo(() => {
    if (!recommendation?.recommendations) return [];
    return [...recommendation.recommendations].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    );
  }, [recommendation]);

  if (loading && !recommendation) {
    return (
      <AdminPanel>
        <div className="flex items-center gap-3 text-[#99907c]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading {type} recommendations…
        </div>
      </AdminPanel>
    );
  }

  if (!recommendation) {
    return (
      <AdminPanel>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Sparkles className="h-10 w-10 text-[#f2ca50]" />
          <h3 className="text-lg font-bold text-[#e5e2e1]">No {type} recommendations yet</h3>
          <p className="max-w-md text-sm text-[#99907c]">
            {TAB_DESCRIPTIONS[type]} Click below to generate the first run, or wait for the
            scheduled daily/weekly job.
          </p>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#f2ca50] transition hover:bg-[#f2ca50]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {regenerating ? "Analyzing…" : "Generate now"}
          </button>
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        </div>
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#99907c]">{TAB_DESCRIPTIONS[type]}</p>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 rounded-lg border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#f2ca50] transition hover:bg-[#f2ca50]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {regenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {regenerating ? "Analyzing…" : "Regenerate"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Items flagged" value={sortedItems.length} icon={Lightbulb} />
        <AdminStatCard label="Recommendations" value={sortedRecs.length} icon={Sparkles} />
        <AdminStatCard
          label="Last generated"
          value={formatDate(recommendation.generatedAt)}
          hint={`Model: ${recommendation.model || "—"}`}
          icon={TrendingUp}
        />
      </div>

      {recommendation.summary ? (
        <AdminPanel title="Summary">
          <p className="text-sm leading-relaxed text-[#e5e2e1]">{recommendation.summary}</p>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Top items">
        {sortedItems.length === 0 ? (
          <p className="text-sm text-[#99907c]">No items flagged.</p>
        ) : (
          <ul className="space-y-3">
            {sortedItems.map((item, idx) => (
              <li key={idx} className="rounded-lg border border-[#4d4635]/60 bg-[#0a0a0a] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.category ? (
                        <span className="rounded border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">
                          {item.category}
                        </span>
                      ) : null}
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.medium
                        }`}
                      >
                        {item.severity}
                      </span>
                      <ConfidenceBadge value={item.confidence} />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#e5e2e1]">{item.title}</p>
                    {item.detail ? (
                      <p className="mt-1 text-sm text-[#99907c]">{item.detail}</p>
                    ) : null}
                  </div>
                  {item.frequency > 0 ? (
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-[#99907c]">Mentions</p>
                      <p className="text-2xl font-bold text-[#f2ca50]">{item.frequency}</p>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="Recommended actions">
        {sortedRecs.length === 0 ? (
          <p className="text-sm text-[#99907c]">No recommendations available.</p>
        ) : (
          <ul className="space-y-3">
            {sortedRecs.map((rec, idx) => (
              <li key={idx} className="rounded-lg border border-[#4d4635]/60 bg-[#0a0a0a] p-4">
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
                        {rec.priority}
                      </span>
                      <ConfidenceBadge value={rec.confidence} />
                    </div>
                    <p className="mt-2 text-sm text-[#e5e2e1]">{rec.action}</p>
                    {rec.expectedImpact ? (
                      <p className="mt-2 text-xs italic text-[#99907c]">
                        Expected impact: {rec.expectedImpact}
                      </p>
                    ) : null}
                    {rec.supportingData ? (
                      <p className="mt-1 text-xs text-[#4d4635]">{rec.supportingData}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      {recommendation.trendsObserved ? (
        <AdminPanel title="Trends observed">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#f2ca50]" />
            <p className="text-sm leading-relaxed text-[#e5e2e1]">
              {recommendation.trendsObserved}
            </p>
          </div>
        </AdminPanel>
      ) : null}

      <p className="text-center text-xs text-[#4d4635]">
        Generated by {recommendation.model || "AI"} · {recommendation.tokensUsed || 0} tokens
      </p>
    </div>
  );
};

const Recommendations = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("reviews");

  useEffect(() => {
    dispatch(fetchAllRecommendations());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchRecommendation(activeTab));
  }, [activeTab, dispatch]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <AdminPage
        eyebrow="Insights"
        title="AI Recommendations"
        description="A unified hub for AI-generated recommendations across reviews, products, drops, analytics, operations, and growth ideas."
      >
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#4d4635]/60 pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
                  isActive
                    ? "border-[#f2ca50]/50 bg-[#f2ca50]/10 text-[#f2ca50]"
                    : "border-transparent text-[#99907c] hover:border-[#4d4635] hover:bg-[#131313] hover:text-[#e5e2e1]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <TabContent type={activeTab} />
      </AdminPage>
    </motion.div>
  );
};

export default Recommendations;
