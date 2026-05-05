import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

import { API_V1_URL } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";

const putConfig = (key, payload) =>
  axios.put(`${API_V1_URL}/site-config/${encodeURIComponent(key)}`, payload, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

const AboutSiteConfig = () => {
  const [pending, setPending] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [statsJson, setStatsJson] = useState("[]");
  const [valuesJson, setValuesJson] = useState("[]");
  const [teamHeading, setTeamHeading] = useState("");
  const [teamSubtext, setTeamSubtext] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_V1_URL}/site-config/about`);
      const d = res.data?.data || {};
      const paras = Array.isArray(d.about_brand_story)
        ? d.about_brand_story.join("\n\n")
        : "";
      setStoryText(paras);
      setStatsJson(JSON.stringify(d.about_stats ?? [], null, 2));
      setValuesJson(JSON.stringify(d.about_values ?? [], null, 2));
      setTeamHeading(typeof d.about_team_heading === "string" ? d.about_team_heading : "");
      setTeamSubtext(typeof d.about_team_subtext === "string" ? d.about_team_subtext : "");
    } catch {
      toast({
        title: "Load failed",
        description: "Could not load About content defaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    let storyArr;
    let statsVal;
    let valuesVal;

    storyArr = storyText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      statsVal = JSON.parse(statsJson || "[]");
    } catch {
      toast({
        title: "Invalid stats JSON",
        description: "Fix About stats JSON before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      valuesVal = JSON.parse(valuesJson || "[]");
    } catch {
      toast({
        title: "Invalid values JSON",
        description: "Fix Brand values JSON before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!teamHeading.trim() || !teamSubtext.trim()) {
      toast({
        title: "Team section",
        description: "Heading and subtext are required.",
        variant: "destructive",
      });
      return;
    }

    setPending(true);
    try {
      await putConfig("about_brand_story", {
        label: "Brand Story Paragraphs",
        value: storyArr,
      });
      await putConfig("about_stats", { label: "About Page Stats", value: statsVal });
      await putConfig("about_values", { label: "Brand Values", value: valuesVal });
      await putConfig("about_team_heading", {
        label: "Team Section Heading",
        value: teamHeading.trim(),
      });
      await putConfig("about_team_subtext", {
        label: "Team Section Subtext",
        value: teamSubtext.trim(),
      });
      toast({ title: "Saved", description: "About page content updated.", variant: "success" });
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Save failed.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <AdminPage
      eyebrow="Site content"
      title="About page"
      description="Edit brand story blocks, headline stats, value cards, and team section shown on /about."
    >
      <div className="w-full space-y-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Brand story (paragraphs)
              </label>
              <p className="text-xs text-muted-foreground">
                Separate paragraphs with one blank line.
              </p>
              <textarea
                rows={12}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Stats JSON
              </label>
              <textarea
                rows={10}
                value={statsJson}
                onChange={(e) => setStatsJson(e.target.value)}
                spellCheck={false}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Values JSON
              </label>
              <p className="text-xs text-muted-foreground">
                Icon names: ShieldCheck, Users, Zap (lucide-react).
              </p>
              <textarea
                rows={14}
                value={valuesJson}
                onChange={(e) => setValuesJson(e.target.value)}
                spellCheck={false}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                  Team heading
                </label>
                <input
                  value={teamHeading}
                  onChange={(e) => setTeamHeading(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                  Team subtext
                </label>
                <input
                  value={teamSubtext}
                  onChange={(e) => setTeamSubtext(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <PrimaryButton
              type="button"
              className="px-8 py-3"
              disabled={pending}
              onClick={() => void handleSave()}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save all"
              )}
            </PrimaryButton>
          </>
        )}
      </div>
    </AdminPage>
  );
};

export default AboutSiteConfig;
