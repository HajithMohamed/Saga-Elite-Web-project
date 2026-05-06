import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  positive: "#10b981", // green-500
  neutral: "#f59e0b",  // amber-500
  negative: "#ef4444"  // red-500
};

const RATINGS_COLORS = {
  5: "#22c55e",
  4: "#84cc16",
  3: "#eab308",
  2: "#f97316",
  1: "#ef4444"
};

const fetchDropList = async () => {
  const { data } = await axios.get(`${API_BASE}/drops/get-all-drops`, { withCredentials: true });
  return data.drops || [];
};

const fetchAnalytics = async (dropId) => {
  const { data } = await axios.get(`${API_BASE}/admin/reviews/drop-analytics/${dropId}`, { withCredentials: true });
  return data.data;
};

export default function DropAnalytics() {
  const [drops, setDrops] = useState([]);
  const [selectedDrop, setSelectedDrop] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropList().then(setDrops).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDrop) {
      setAnalytics(null);
      return;
    }
    setLoading(true);
    fetchAnalytics(selectedDrop)
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDrop]);

  const renderDecision = () => {
    if (!analytics || analytics.totalReviews === 0) return "Not enough data to recommend.";
    const posPercent = (analytics.sentiment.positive / analytics.totalReviews) * 100;
    
    if (analytics.averageRating >= 4.0 && posPercent > 70) {
      return "Recommend: Produce more of this design. High positive sentiment detected.";
    } else if (analytics.averageRating >= 3.0 && analytics.averageRating < 4.0) {
      return "Recommend: Minor redesign — gather more feedback.";
    } else {
      return "Recommend: Reconsider this design — significant dissatisfaction detected.";
    }
  };

  const sentimentData = analytics ? [
    { name: "Positive", value: analytics.sentiment.positive || 0, color: COLORS.positive },
    { name: "Neutral", value: analytics.sentiment.neutral || 0, color: COLORS.neutral },
    { name: "Negative", value: analytics.sentiment.negative || 0, color: COLORS.negative },
  ].filter(d => d.value > 0) : [];

  const ratingData = analytics ? [
    { rating: "5 Stars", count: analytics.ratingDistribution[5] || 0, fill: RATINGS_COLORS[5] },
    { rating: "4 Stars", count: analytics.ratingDistribution[4] || 0, fill: RATINGS_COLORS[4] },
    { rating: "3 Stars", count: analytics.ratingDistribution[3] || 0, fill: RATINGS_COLORS[3] },
    { rating: "2 Stars", count: analytics.ratingDistribution[2] || 0, fill: RATINGS_COLORS[2] },
    { rating: "1 Star", count: analytics.ratingDistribution[1] || 0, fill: RATINGS_COLORS[1] },
  ] : [];

  return (
    <AdminPage
      eyebrow="Intelligence"
      title="Drop Analytics"
      description="Review drop performance, feedback sentiment, and key metrics."
      headerAction={
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
        
        {/* Dropdown Selection */}
        <div className="bg-[#111] p-6 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex-1 max-w-sm">
            <label className="block text-xs uppercase tracking-widest text-[#D4AF37] mb-2 font-semibold">Select a Drop</label>
            <select
              value={selectedDrop}
              onChange={(e) => setSelectedDrop(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">-- Choose Drop --</option>
              {drops.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        )}

        {!loading && analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-wider">Total Sales</p>
                <p className="text-3xl text-white font-serif mt-2">{analytics.totalSales}</p>
              </div>
              <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-wider">Est. Revenue</p>
                <p className="text-3xl text-white font-serif mt-2 text-[#D4AF37]">Rs. {analytics.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-wider">Total Reviews</p>
                <p className="text-3xl text-white font-serif mt-2">{analytics.totalReviews}</p>
              </div>
              <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-wider">Avg Rating</p>
                <p className="text-3xl text-white font-serif mt-2">{analytics.averageRating} / 5.0</p>
              </div>
            </div>

            {analytics.totalReviews > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SENTIMENT */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">Sentiment Analysis</h3>
                    <div className="h-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#333", color: "#FFF" }} />
                          <Legend wrapperStyle={{ fontSize: "12px", textTransform: "uppercase" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* RATING DIST */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                     <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">Rating Distribution</h3>
                     <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={ratingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                           <XAxis type="number" stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
                           <YAxis dataKey="rating" type="category" stroke="#888" tick={{ fill: "#888", fontSize: 12 }} width={80} />
                           <Tooltip cursor={{ fill: "#222" }} contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#333", color: "#FFF" }} />
                           <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                             {ratingData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.fill} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-6 rounded-2xl border border-[#D4AF37]/30">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-2">Automated Recommendation</h3>
                  <p className="text-white lg:text-lg">{renderDecision()}</p>
                </div>
                
                {analytics.topProducts.length > 0 && (
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                     <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Top Products in Drop</h3>
                     <div className="space-y-3">
                       {analytics.topProducts.map((p, i) => (
                         <div key={i} className="flex justify-between items-center text-sm p-4 bg-[#1A1A1A] rounded-lg">
                           <span className="text-white font-medium">{p.name}</span>
                           <span className="text-white/50">{p.avgRating} <span className="text-[#D4AF37]">★</span> ({p.reviewCount} reviews)</span>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 px-6 bg-[#111] rounded-2xl border border-white/10 mt-4">
                <p className="text-white/60">No reviews found for this drop yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminPage>
  );
}