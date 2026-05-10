import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import {
  fetchAlerts,
  acknowledgeAlert,
  runAlertChecks,
} from "@/store/smartAlertsSlice";
import { toast } from "@/hooks/use-toast";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const SEVERITY_STYLES = {
  high: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
};

const formatRelative = (value) => {
  if (!value) return "";
  const ms = Date.now() - new Date(value).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
};

const Alerts = () => {
  const dispatch = useDispatch();
  const { alerts, loading, acknowledging, running } = useSelector((state) => state.smartAlerts);

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const handleAck = async (id) => {
    const result = await dispatch(acknowledgeAlert(id));
    if (acknowledgeAlert.fulfilled.match(result)) {
      toast({ title: "Alert acknowledged", variant: "success" });
    }
  };

  const handleRun = async () => {
    const result = await dispatch(runAlertChecks());
    if (runAlertChecks.fulfilled.match(result)) {
      toast({
        title: "Checks running",
        description: "New alerts will appear shortly.",
        variant: "success",
      });
      // Re-fetch after a brief delay to show any new alerts
      setTimeout(() => dispatch(fetchAlerts()), 3000);
    }
  };

  const sorted = [...alerts].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
      new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <AdminPage
        eyebrow="Insights"
        title="Smart Alerts"
        description="Threshold-based notifications when business KPIs drift. Acknowledge to clear from this list."
        actions={
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#f2ca50] transition hover:bg-[#f2ca50]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {running ? "Running…" : "Run checks"}
          </button>
        }
      >
        {loading && alerts.length === 0 ? (
          <AdminPanel>
            <div className="flex items-center gap-3 text-[#99907c]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading alerts…
            </div>
          </AdminPanel>
        ) : sorted.length === 0 ? (
          <AdminPanel>
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <h3 className="text-lg font-bold text-[#e5e2e1]">All clear</h3>
              <p className="max-w-md text-sm text-[#99907c]">
                No active alerts. The system checks every hour for refund/cancellation spikes,
                stock-outs on demanded items, revenue drops, low conversion, and negative review streaks.
              </p>
            </div>
          </AdminPanel>
        ) : (
          <ul className="space-y-3">
            {sorted.map((alert) => (
              <li
                key={alert._id}
                className={`rounded-lg border p-4 ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold uppercase tracking-wide">{alert.title}</h4>
                        <span className="rounded border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {alert.severity}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider opacity-70">
                          {formatRelative(alert.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{alert.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAck(alert._id)}
                    disabled={acknowledging[alert._id]}
                    className="inline-flex items-center gap-1.5 rounded border border-current px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition hover:bg-black/20 disabled:opacity-50"
                  >
                    {acknowledging[alert._id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Ack
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPage>
    </motion.div>
  );
};

export default Alerts;
