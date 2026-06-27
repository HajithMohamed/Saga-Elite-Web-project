import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, FolderTree, FolderPlus } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/admin-components/_shared/Buttons";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40";
const labelClass =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500";

const EMPTY_FORM = {
  name: "",
  slug: "",
  sortOrder: 0,
  isFeatured: false,
  showOnHome: false,
  isActive: true,
  metaTitle: "",
  metaDescription: "",
};

// ── Tree helpers (operate on the flat category list from GET /categories) ──
const buildById = (list) => {
  const map = new Map();
  list.forEach((c) => map.set(String(c._id), c));
  return map;
};

// Walk up parentCategory links to the top-level ("main") ancestor id.
const topAncestorId = (id, byId) => {
  let cur = byId.get(String(id));
  let guard = 0;
  while (cur?.parentCategory && byId.get(String(cur.parentCategory)) && guard < 20) {
    cur = byId.get(String(cur.parentCategory));
    guard += 1;
  }
  return cur ? String(cur._id) : null;
};

// "Gents › Clothing › T-Shirts" breadcrumb for a category id.
const pathOf = (id, byId) => {
  const parts = [];
  let cur = byId.get(String(id));
  let guard = 0;
  while (cur && guard < 20) {
    parts.unshift(cur.name);
    cur = cur.parentCategory ? byId.get(String(cur.parentCategory)) : null;
    guard += 1;
  }
  return parts.join(" › ");
};

// Ids of every descendant of `id` (to exclude when picking a parent → no cycles).
const descendantsOf = (id, list) => {
  const childrenMap = {};
  list.forEach((c) => {
    const p = c.parentCategory ? String(c.parentCategory) : null;
    if (p) (childrenMap[p] = childrenMap[p] || []).push(String(c._id));
  });
  const out = new Set();
  const stack = [String(id)];
  while (stack.length) {
    const cur = stack.pop();
    (childrenMap[cur] || []).forEach((child) => {
      if (!out.has(child)) {
        out.add(child);
        stack.push(child);
      }
    });
  }
  return out;
};

const CategoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [categoryType, setCategoryType] = useState("main"); // "main" | "sub"
  const [mainCategory, setMainCategory] = useState(""); // top-level ancestor id
  const [subParent, setSubParent] = useState(""); // optional deeper parent id
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const all = res.data?.data || [];
      setCategories(all);
      if (isEdit) {
        const byId = buildById(all);
        const cat = all.find((c) => c._id === id);
        if (cat) {
          setForm({
            name: cat.name || "",
            slug: cat.slug || "",
            sortOrder: cat.sortOrder ?? 0,
            isFeatured: !!cat.isFeatured,
            showOnHome: !!cat.showOnHome,
            isActive: cat.isActive !== false,
            metaTitle: cat.meta?.title || "",
            metaDescription: cat.meta?.description || "",
          });
          const parentId = cat.parentCategory ? String(cat.parentCategory) : "";
          if (!parentId) {
            setCategoryType("main");
            setMainCategory("");
            setSubParent("");
          } else {
            const top = topAncestorId(parentId, byId);
            setCategoryType("sub");
            setMainCategory(top || parentId);
            setSubParent(parentId !== top ? parentId : "");
          }
        } else {
          toast({ title: "Category not found", variant: "destructive" });
        }
      }
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, val) => setForm((curr) => ({ ...curr, [key]: val }));

  const byId = useMemo(() => buildById(categories), [categories]);

  // The editing category and its descendants can never be its own ancestor.
  const excludedIds = useMemo(() => {
    const set = isEdit ? descendantsOf(id, categories) : new Set();
    if (isEdit) set.add(String(id));
    return set;
  }, [id, isEdit, categories]);

  // Main = top-level categories (no parent) — typically Gents / Ladies / Unisex.
  const mainOptions = useMemo(
    () =>
      categories
        .filter((c) => !c.parentCategory && !excludedIds.has(String(c._id)))
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.name).localeCompare(String(b.name))
        ),
    [categories, excludedIds]
  );

  // Deeper parents available under the chosen main (any depth), cycle-safe.
  const subParentOptions = useMemo(() => {
    if (!mainCategory) return [];
    return categories
      .filter((c) => {
        const sid = String(c._id);
        if (sid === String(mainCategory)) return false;
        if (excludedIds.has(sid)) return false;
        return topAncestorId(sid, byId) === String(mainCategory);
      })
      .map((c) => {
        // Show the path relative to the selected main (drop the main name prefix).
        const full = pathOf(c._id, byId);
        const rel = full.split(" › ").slice(1).join(" › ") || full;
        return { _id: c._id, label: rel };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, mainCategory, byId, excludedIds]);

  const mainName = mainCategory ? byId.get(String(mainCategory))?.name : "";

  const onTypeChange = (type) => {
    setCategoryType(type);
    if (type === "main") {
      setMainCategory("");
      setSubParent("");
    }
  };

  const onMainChange = (value) => {
    setMainCategory(value);
    setSubParent(""); // deeper parent must be re-picked within the new main
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (categoryType === "sub" && !mainCategory) {
      toast({
        title: "Select a main hierarchy",
        description: "Choose Gents, Ladies, Unisex, or another main category.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const parentCategory =
      categoryType === "main" ? null : subParent || mainCategory || null;
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parentCategory,
      sortOrder: Number(form.sortOrder) || 0,
      isFeatured: form.isFeatured,
      showOnHome: form.showOnHome,
      isActive: form.isActive,
      meta: {
        title: form.metaTitle.trim(),
        description: form.metaDescription.trim(),
      },
    };
    try {
      if (isEdit) {
        await axios.put(`${API_BASE}/admin/categories/${id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_BASE}/admin/categories`, payload, {
          withCredentials: true,
        });
      }
      toast({
        title: isEdit ? "Category updated" : "Category created",
        variant: "success",
      });
      navigate("/admin/categories");
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

  if (loading) {
    return (
      <AdminPage eyebrow="Store" title={isEdit ? "Edit Category" : "New Category"}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      </AdminPage>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <AdminPage
        eyebrow="Store"
        title={isEdit ? "Edit Category" : "New Category"}
        description="Categories power the storefront navigation, mega-menu, and homepage category grid. Pick a main hierarchy (Gents, Ladies, Unisex…) then nest subcategories beneath it."
        actions={
          <PrimaryButton
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Save changes" : "Create category"}
          </PrimaryButton>
        }
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Hierarchy */}
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Hierarchy
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onTypeChange("main")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition ${
                  categoryType === "main"
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "border-white/10 text-gray-300 hover:border-white/25"
                }`}
              >
                <FolderTree className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium">Main category</span>
                  <span className="block text-[11px] text-gray-500">
                    Top level (e.g. Gents)
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("sub")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition ${
                  categoryType === "sub"
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "border-white/10 text-gray-300 hover:border-white/25"
                }`}
              >
                <FolderPlus className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium">Subcategory</span>
                  <span className="block text-[11px] text-gray-500">
                    Nested under a main
                  </span>
                </span>
              </button>
            </div>

            {categoryType === "sub" && (
              <>
                <div>
                  <label className={labelClass}>Main hierarchy *</label>
                  {mainOptions.length === 0 ? (
                    <p className="mt-1 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] text-amber-300/90">
                      No main categories exist yet. Create Gents / Ladies / Unisex as a
                      “Main category” first, or run{" "}
                      <code className="font-mono text-amber-200">npm run seed:categories</code>.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {mainOptions.map((c) => {
                        const active = String(mainCategory) === String(c._id);
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => onMainChange(c._id)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                              active
                                ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                                : "border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {mainCategory ? (
                  <div>
                    <label className={labelClass}>
                      Subcategories under {mainName}
                    </label>
                    {subParentOptions.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-white/10 bg-black/30 px-3 py-2.5 text-[12px] text-gray-500">
                        No subcategories under {mainName} yet — this one will be the first.
                      </p>
                    ) : (
                      <>
                        <select
                          value={subParent}
                          onChange={(e) => setSubParent(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">— Directly under {mainName} —</option>
                          {subParentOptions.map((opt) => (
                            <option key={opt._id} value={opt._id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p className="mb-2 mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-600">
                          {subParentOptions.length} existing — pick a parent, or leave it
                          directly under {mainName}.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {subParentOptions.map((opt) => (
                            <span
                              key={opt._id}
                              className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-gray-400"
                            >
                              {opt.label}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </section>

          {/* Basics */}
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder={categoryType === "main" ? "e.g. Gents" : "e.g. T-Shirts"}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Slug (optional)</label>
              <input
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="Auto-generated from the name if left blank"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
                className={inputClass}
              />
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-600">
                Lower numbers appear first.
              </p>
            </div>
          </section>

          {/* Visibility */}
          <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Visibility
            </h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                className="accent-[#D4AF37]"
              />
              Active (visible on storefront)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setField("isFeatured", e.target.checked)}
                className="accent-[#D4AF37]"
              />
              Featured
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.showOnHome}
                onChange={(e) => setField("showOnHome", e.target.checked)}
                className="accent-[#D4AF37]"
              />
              Show on homepage
            </label>
          </section>

          {/* SEO */}
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              SEO
            </h2>
            <div>
              <label className={labelClass}>Meta title</label>
              <input
                value={form.metaTitle}
                onChange={(e) => setField("metaTitle", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Meta description</label>
              <textarea
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setField("metaDescription", e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <SecondaryButton
              type="button"
              onClick={() => navigate("/admin/categories")}
              disabled={saving}
            >
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </AdminPage>
    </motion.div>
  );
};

export default CategoryEditor;
