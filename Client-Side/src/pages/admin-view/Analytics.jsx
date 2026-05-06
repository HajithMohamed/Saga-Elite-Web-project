import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage, AdminPanel, AdminStatCard } from "@/components/admin-components/AdminUI";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/products/analytics`, { withCredentials: true })
      .then((res) => setAnalytics(res.data.analytics || null))
      .catch((err) => console.error("Failed to fetch admin analytics", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPage
      eyebrow="Intelligence"
      title="Analytics"
      description="Site-wide product analytics and trends."
      actions={
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      }
    >
      <div className="mx-auto max-w-7xl flex flex-col gap-6 pb-20">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        )}

        {!loading && analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AdminStatCard label="Best Sellers" value={analytics.bestSellers?.length || 0} hint="Top selling products" />
              <AdminStatCard label="Most Wished" value={analytics.mostWished?.length || 0} hint="Top wishlisted products" />
              <AdminStatCard label="Total Products" value={analytics.totalProducts ?? "—"} hint="Catalog size" />
              <AdminStatCard label="Reports" value={analytics.reportsCount ?? "—"} hint="Custom reports" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Best Sellers</h3>
                <div className="space-y-3">
                  {analytics.bestSellers.map((p, i) => (
                    <div key={p.slug || p.artNo || i} className="flex justify-between items-center text-sm p-3 bg-[#1A1A1A] rounded-lg">
                      <div>
                        <div className="text-white font-medium">{p.name}</div>
                        <div className="text-white/40 text-xs">{p.brand} • {p.category}</div>
                      </div>
                      <div className="text-white/50">{p.soldCount} sold</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Most Wished</h3>
                <div className="space-y-3">
                  {analytics.mostWished.map((p, i) => (
                    <div key={p.slug || p.artNo || i} className="flex justify-between items-center text-sm p-3 bg-[#1A1A1A] rounded-lg">
                      <div>
                        <div className="text-white font-medium">{p.name}</div>
                        <div className="text-white/40 text-xs">{p.brand} • {p.category}</div>
                      </div>
                      <div className="text-white/50">{p.wishCount || 0} wished</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !analytics && (
          <div className="text-center py-20 px-6 bg-[#111] rounded-2xl border border-white/10 mt-4">
            <p className="text-white/60">No analytics available.</p>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
