import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Globe,
  Image as ImageIcon,
  Users as UsersIcon,
  MessageSquareQuote,
  Plus,
  Trash2,
  Save,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";

const TABS = [
  { key: "ugc", label: "UGC Photos", icon: ImageIcon },
  { key: "influencers", label: "Influencers", icon: UsersIcon },
  { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
];

const PLATFORMS = ["instagram", "tiktok", "youtube", "x", "facebook"];
const STATUSES = ["prospect", "active", "completed", "paused"];

/* --------------------------------------------------------------------- */
/* UGC Tab                                                                */
/* --------------------------------------------------------------------- */

const UgcTab = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios
        .get(`${API_BASE}/image/get-social-ugc-images`, {
          withCredentials: true,
        })
        .catch((err) => {
          if (err?.response?.status === 404) return { data: { images: [] } };
          throw err;
        });
      setImages(res.data?.images || []);
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const fd = new FormData();
    fd.append("refModel", "System");
    fd.append("type", "social-ugc");
    files.forEach((f) => fd.append("images", f));
    try {
      setUploading(true);
      await axios.post(`${API_BASE}/image/upload-image`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({ title: `Uploaded ${files.length} photo${files.length === 1 ? "" : "s"}` });
      await fetchImages();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm("Delete this UGC photo?")) return;
    try {
      await axios.delete(`${API_BASE}/image/delete-image/${image._id}`, {
        withCredentials: true,
      });
      toast({ title: "Deleted" });
      await fetchImages();
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#99907c]">
          Customer & influencer photos shown in the homepage social proof
          section. Images are stored as `social-ugc` system images.
        </p>
        <label
          className={`flex cursor-pointer items-center gap-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] ${
            uploading
              ? "cursor-not-allowed bg-[#f2ca50]/40"
              : "bg-[#f2ca50] hover:bg-[#ffe088]"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}{" "}
          Upload UGC
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
        </div>
      ) : images.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center text-xs uppercase tracking-widest text-[#888]">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[#4d4635]" />
          No UGC photos uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img._id}
              className="group relative overflow-hidden border border-[#2a2a2a] bg-[#0a0a0a]"
            >
              <img
                src={img.url}
                alt={img.altText || "UGC"}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => handleDelete(img)}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-[#99907c] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------- */
/* Influencers Tab                                                        */
/* --------------------------------------------------------------------- */

const initialInfluencerForm = {
  name: "",
  handle: "",
  platform: "instagram",
  campaignName: "",
  status: "prospect",
  contactEmail: "",
  notes: "",
};

const InfluencersTab = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialInfluencerForm);
  const [showForm, setShowForm] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios
        .get(`${API_BASE}/influencers/admin`, { withCredentials: true })
        .catch(() => ({ data: { data: { influencers: [] } } }));
      setList(res.data?.data?.influencers || []);
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const startCreate = () => {
    setEditingId(null);
    setForm(initialInfluencerForm);
    setShowForm(true);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      handle: item.handle || "",
      platform: item.platform || "instagram",
      campaignName: item.campaignName || "",
      status: item.status || "prospect",
      contactEmail: item.contactEmail || "",
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.handle.trim()) {
      toast({ title: "Name and handle are required", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await axios.patch(
          `${API_BASE}/influencers/admin/${editingId}`,
          form,
          { withCredentials: true }
        );
        toast({ title: "Influencer updated" });
      } else {
        await axios.post(`${API_BASE}/influencers/admin`, form, {
          withCredentials: true,
        });
        toast({ title: "Influencer added" });
      }
      setForm(initialInfluencerForm);
      setEditingId(null);
      setShowForm(false);
      fetchList();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove ${item.handle}?`)) return;
    try {
      await axios.delete(`${API_BASE}/influencers/admin/${item._id}`, {
        withCredentials: true,
      });
      toast({ title: "Influencer removed" });
      fetchList();
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#99907c]">
          Track outreach: prospects, active campaigns, completed collabs.
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-[#f2ca50] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088]"
        >
          <Plus className="h-4 w-4" /> Add influencer
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={submit}
          className="space-y-4 border border-[#f2ca50]/30 bg-[#131313] p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
              {editingId ? "Edit influencer" : "Add influencer"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(initialInfluencerForm);
              }}
              className="text-xs uppercase tracking-[0.22em] text-[#99907c] hover:text-[#e5e2e1]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Display name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="@handle"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
              required
            />
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Campaign name"
              value={form.campaignName}
              onChange={(e) =>
                setForm({ ...form, campaignName: e.target.value })
              }
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
            />
            <input
              type="email"
              placeholder="Contact email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
            />
            <textarea
              placeholder="Notes (negotiated rate, deliverables, dates…)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none md:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-[#f2ca50] px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {editingId ? "Save changes" : "Add influencer"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
        </div>
      ) : list.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center text-xs uppercase tracking-widest text-[#888]">
          No influencers tracked yet.
        </div>
      ) : (
        <div className="overflow-hidden border border-[#2a2a2a] bg-[#131313]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#2a2a2a] bg-[#1a1a1a] font-mono text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Handle</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-[#2a2a2a]/40 hover:bg-[#1a1a1a]"
                >
                  <td className="px-4 py-3 text-[#e5e2e1]">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-[#d0c5af]">
                    @{item.handle}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#d0c5af]">
                    {item.platform}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#d0c5af]">
                    {item.campaignName || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                        item.status === "active"
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : item.status === "completed"
                            ? "border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50]"
                            : item.status === "paused"
                              ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                              : "border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="border border-[#4d4635] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="border border-red-500/20 p-1.5 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------- */
/* Testimonials Tab                                                       */
/* --------------------------------------------------------------------- */

const TestimonialsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/testimonials`, {
        withCredentials: true,
      });
      const value = res.data?.data ?? res.data?.value;
      setItems(Array.isArray(value) ? value : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setDirty(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        quote: "",
        productSlug: "",
        displayOrder: prev.length,
        isActive: true,
      },
    ]);
    setDirty(true);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = items
        .filter((t) => (t.name || "").trim() && (t.quote || "").trim())
        .map((t, i) => ({
          name: String(t.name).trim(),
          quote: String(t.quote).trim(),
          productSlug: String(t.productSlug || "").trim(),
          displayOrder:
            typeof t.displayOrder === "number" ? t.displayOrder : i,
          isActive: t.isActive !== false,
        }));
      await axios.put(
        `${API_BASE}/site-config/testimonials`,
        { label: "Testimonials", value: cleaned },
        { withCredentials: true }
      );
      setItems(cleaned);
      setDirty(false);
      toast({ title: "Testimonials saved" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#99907c]">
          Curated quotes shown on the homepage (separate from product reviews).
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 border border-[#4d4635] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
          >
            <Plus className="h-3 w-3" /> Add testimonial
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 bg-[#f2ca50] px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center text-xs uppercase tracking-widest text-[#888]">
          No testimonials yet — add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="border border-[#2a2a2a] bg-[#131313] p-4"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={item.name || ""}
                  onChange={(e) => updateField(index, "name", e.target.value)}
                  placeholder="Customer name"
                  className="border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
                />
                <input
                  type="text"
                  value={item.productSlug || ""}
                  onChange={(e) =>
                    updateField(index, "productSlug", e.target.value)
                  }
                  placeholder="Product slug (optional)"
                  className="border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
                />
                <input
                  type="number"
                  value={item.displayOrder ?? index}
                  onChange={(e) =>
                    updateField(
                      index,
                      "displayOrder",
                      Number(e.target.value)
                    )
                  }
                  placeholder="Order"
                  className="border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
                />
              </div>
              <textarea
                value={item.quote || ""}
                onChange={(e) => updateField(index, "quote", e.target.value)}
                placeholder="The quote…"
                rows={2}
                className="mt-3 w-full border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af]">
                  <input
                    type="checkbox"
                    checked={item.isActive !== false}
                    onChange={(e) =>
                      updateField(index, "isActive", e.target.checked)
                    }
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-[#99907c] hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------- */
/* Main                                                                   */
/* --------------------------------------------------------------------- */

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState("ugc");

  return (
    <AdminPage
      eyebrow="Community & Social"
      title="Community"
      description="Manage UGC photos, influencer outreach, and curated testimonials."
      actions={<Globe className="h-5 w-5 text-[#f2ca50]" />}
    >
      <div className="mx-auto max-w-6xl pb-20">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#2a2a2a] pb-4">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? "border-[#f2ca50] bg-[#131313] text-[#f2ca50]"
                    : "border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]"
                }`}
              >
                <TabIcon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "ugc" ? <UgcTab /> : null}
        {activeTab === "influencers" ? <InfluencersTab /> : null}
        {activeTab === "testimonials" ? <TestimonialsTab /> : null}
      </div>
    </AdminPage>
  );
};

export default CommunityPage;
