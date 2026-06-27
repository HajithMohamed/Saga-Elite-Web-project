import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save } from "lucide-react";
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
  parentCategory: "",
  sortOrder: 0,
  isFeatured: false,
  showOnHome: false,
  isActive: true,
  metaTitle: "",
  metaDescription: "",
};

const CategoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const all = res.data?.data || [];
      setCategories(all);
      if (isEdit) {
        const cat = all.find((c) => c._id === id);
        if (cat) {
          setForm({
            name: cat.name || "",
            slug: cat.slug || "",
            parentCategory: cat.parentCategory || "",
            sortOrder: cat.sortOrder ?? 0,
            isFeatured: !!cat.isFeatured,
            showOnHome: !!cat.showOnHome,
            isActive: cat.isActive !== false,
            metaTitle: cat.meta?.title || "",
            metaDescription: cat.meta?.description || "",
          });
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

  // Exclude self from parent options to prevent a category being its own parent.
  const parentOptions = useMemo(
    () => categories.filter((c) => c._id !== id),
    [categories, id]
  );

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parentCategory: form.parentCategory || null,
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
        description="Categories power the storefront navigation, mega-menu, and homepage category grid."
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
          {/* Basics */}
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Gents"
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
              <label className={labelClass}>Parent category</label>
              <select
                value={form.parentCategory}
                onChange={(e) => setField("parentCategory", e.target.value)}
                className={inputClass}
              >
                <option value="">— Top level —</option>
                {parentOptions.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
