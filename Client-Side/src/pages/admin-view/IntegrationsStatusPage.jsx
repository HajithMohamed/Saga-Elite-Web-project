import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { AdminPage } from "@/components/admin-components/AdminUI";

const ServiceCard = ({ service }) => (
  <div className="flex flex-col gap-3 border border-[#2a2a2a] bg-[#131313] p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[#FAF7F2]">{service.service}</h3>
        <p className="mt-1 text-xs leading-5 text-[#99907c]">{service.description}</p>
      </div>
      {service.configured ? (
        <span className="flex shrink-0 items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Configured
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-400">
          <XCircle className="h-3.5 w-3.5" /> Missing
        </span>
      )}
    </div>

    {service.configured && service.maskedIdentifier ? (
      <div className="text-xs text-[#d0c5af]">
        <span className="text-[#99907c]">Identifier: </span>
        <span className="font-mono">{service.maskedIdentifier}</span>
      </div>
    ) : null}

    <div className="border-t border-[#2a2a2a] pt-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#574500]">Env keys</p>
      <p className="mt-1 break-words font-mono text-[11px] text-[#99907c]">{service.envHint}</p>
    </div>
  </div>
);

const IntegrationsStatusPage = () => {
  const [services, setServices] = useState([]);
  const [note, setNote] = useState("");
  const [environment, setEnvironment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await axiosInstance.get("/super-admin/integration-status");
      const data = res.data?.data || {};
      setServices(data.services || []);
      setNote(data.note || "");
      setEnvironment(data.environment || "");
    } catch (err) {
      toast({
        title: "Could not load integration status",
        description: err?.response?.data?.message || err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const configuredCount = services.filter((s) => s.configured).length;

  return (
    <AdminPage
      eyebrow="Settings"
      title="API Configuration"
      description="Read-only status of third-party service configuration. Values are managed in the server .env file — no secrets are stored in the database or shown here."
      actions={
        <button
          type="button"
          onClick={() => fetchStatus({ silent: true })}
          className="flex items-center gap-2 border border-[#2a2a2a] bg-[#131313] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#d0c5af] transition hover:border-[#f2ca50] hover:text-[#f2ca50]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 border border-[#2a2a2a] bg-[#131313] px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-[#FAF7F2]">
              <Plug className="h-4 w-4 text-[#f2ca50]" />
              <span className="font-semibold">{configuredCount}</span>
              <span className="text-[#99907c]">of {services.length} services configured</span>
            </div>
            {environment ? (
              <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-2.5 py-1 font-mono text-[11px] text-[#99907c]">
                NODE_ENV: {environment}
              </span>
            ) : null}
            <div className="flex items-center gap-1.5 text-[11px] text-[#99907c]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Presence check only — secret values never leave the server.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.service} service={service} />
            ))}
          </div>

          {note ? <p className="text-xs text-[#574500]">{note}</p> : null}
        </div>
      )}
    </AdminPage>
  );
};

export default IntegrationsStatusPage;
