import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Star,
  Package,
  Wrench,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { toast } from "@/hooks/use-toast";
import {
  fetchAllRecommendationsApi,
  regenerateRecommendationApi,
} from "@/api/recommendationsAPI";

const STREAMS = [
  { type: "analytics", label: "Business KPIs", icon: TrendingUp, blurb: "Revenue, orders & AOV vs the prior period." },
  { type: "products", label: "Catalog", icon: ShoppingBag, blurb: "What to promote, restock, retire or rework." },
  { type: "reviews", label: "Customer Voice", icon: Star, blurb: "Recurring themes from recent reviews." },
  { type: "drops", label: "Drops", icon: Package, blurb: "Timing, theme & sizing for the next drop." },
  { type: "improvements", label: "Operations", icon: Wrench, blurb: "Friction to fix across logistics & service." },
  { type: "ideas", label: "Growth Ideas", icon: Lightbulb, blurb: "Bold-but-realistic ways to grow." },
];

const LEVEL_STYLES = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const LevelChip = ({ level }) => (
  <span
    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${
      LEVEL_STYLES[level] || LEVEL_STYLES.medium
    }`}
  >
    {level || "medium"}
  </span>
);

const ConfidenceBar = ({ value }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full bg-gold" style={{ width: `${v}%` }} />
      </div>
      <span className="font-mono text-[9px] tabular-nums text-ink/50">{v}%</span>
    </div>
  );
};

const AIInsightsPage = () => {
  const [data, setData] = useState({});
  const [aiConfigured, setAiConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("analytics");
  const [regenerating, setRegenerating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAllRecommendationsApi();
      setData(res.data?.data || {});
      setAiConfigured(res.data?.aiConfigured !== false);
    } catch (err) {
      toast({
        title: "Couldn't load insights",
        description:
          err?.response?.data?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegenerate = async (type) => {
    setRegenerating(type);
    try {
      const res = await regenerateRecommendationApi(type);
      if (res.data?.data) {
        setData((prev) => ({ ...prev, [type]: res.data.data }));
        toast({ title: "Insight regenerated" });
      } else {
        toast({
          title: "Not enough data yet",
          description:
            res.data?.message || "There isn't enough recent activity for this stream.",
        });
      }
    } catch (err) {
      toast({
        title: "Generation failed",
        description:
          err?.response?.data?.message ||
          "The AI service didn't respond. Try again shortly.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(null);
    }
  };

  const activeStream = useMemo(
    () => STREAMS.find((s) => s.type === activeType),
    [activeType]
  );
  const doc = data[activeType] || null;
  const isRegenerating = regenerating === activeType;

  return (
    <AdminPage
      eyebrow="Intelligence"
      title="AI Insights"
      description="Automated analysis of your reviews, catalog, drops and KPIs — generated overnight by Claude. Regenerate any stream on demand."
    >
      {!aiConfigured ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-200">
              Claude (Anthropic) is not configured on the server
            </p>
            <p className="mt-1 text-xs text-amber-200/80">
              Set <code className="rounded bg-black/30 px-1">ANTHROPIC_API_KEY</code> in the
              backend environment to enable insight generation. Any previously
              generated insights are still shown below.
            </p>
          </div>
        </div>
      ) : null}

      {/* Stream tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STREAMS.map((s) => {
          const Icon = s.icon;
          const isActive = s.type === activeType;
          const has = Boolean(data[s.type]);
          return (
            <button
              key={s.type}
              type="button"
              onClick={() => setActiveType(s.type)}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors ${
                isActive
                  ? "border-gold-ink bg-gold/10"
                  : "border-line/60 bg-page hover:border-gold-ink/40"
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <Icon className={`h-4 w-4 ${isActive ? "text-gold-ink" : "text-ink/60"}`} />
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    has ? "bg-emerald-400" : "bg-ink/20"
                  }`}
                  title={has ? "Insight available" : "Not generated yet"}
                />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active stream panel */}
      <div className="rounded-3xl border border-line/60 bg-page p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-2">
              <Sparkles className="h-4 w-4 text-gold-ink" />
              {activeStream?.label}
            </h2>
            <p className="mt-1 text-xs text-ink/50">{activeStream?.blurb}</p>
            {doc ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
                Generated {fmtDate(doc.generatedAt)} · {doc.model || "model"} ·{" "}
                {doc.tokensUsed || 0} tokens
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => handleRegenerate(activeType)}
            disabled={isRegenerating || loading}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ongold transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Generating…" : "Regenerate"}
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-ink/50">Loading insights…</p>
        ) : !doc ? (
          <div className="rounded-2xl border border-dashed border-line/60 p-10 text-center">
            <p className="text-sm text-ink/60">No insight generated yet.</p>
            <p className="mt-1 text-xs text-ink/40">
              These run automatically overnight — or click Regenerate to create one now.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {doc.summary ? (
              <p className="text-sm leading-6 text-ink-2">{doc.summary}</p>
            ) : null}

            {Array.isArray(doc.items) && doc.items.length > 0 ? (
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-ink2">
                  Key findings
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {doc.items.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-line/60 bg-card/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink-2">{item.title}</p>
                        {item.severity ? <LevelChip level={item.severity} /> : null}
                      </div>
                      {item.detail ? (
                        <p className="mt-1.5 text-xs leading-5 text-ink/60">{item.detail}</p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between">
                        {item.category ? (
                          <span className="text-[9px] uppercase tracking-[0.18em] text-ink/40">
                            {item.category}
                          </span>
                        ) : <span />}
                        <ConfidenceBar value={item.confidence} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(doc.recommendations) && doc.recommendations.length > 0 ? (
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-ink2">
                  Recommended actions
                </p>
                <div className="space-y-3">
                  {doc.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-line/60 bg-card/40 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {rec.priority ? <LevelChip level={rec.priority} /> : null}
                        {rec.area ? (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50">
                            {rec.area}
                          </span>
                        ) : null}
                        <span className="ml-auto">
                          <ConfidenceBar value={rec.confidence} />
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-2">{rec.action}</p>
                      {rec.expectedImpact ? (
                        <p className="mt-1.5 text-xs text-emerald-300/80">
                          Expected impact: {rec.expectedImpact}
                        </p>
                      ) : null}
                      {rec.supportingData ? (
                        <p className="mt-1 text-[11px] text-ink/40">{rec.supportingData}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {doc.trendsObserved ? (
              <div className="rounded-2xl border border-line/60 bg-card/40 p-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-ink2">
                  Trends observed
                </p>
                <p className="text-xs leading-5 text-ink/60">{doc.trendsObserved}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminPage>
  );
};

export default AIInsightsPage;
