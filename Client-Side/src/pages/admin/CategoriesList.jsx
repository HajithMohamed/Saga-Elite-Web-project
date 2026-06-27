import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Loader2, FolderTree, Star } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";

const CategoriesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      setCategories(res.data?.data || []);
    } catch (err) {
      toast({
        title: "Could not load categories",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const nameById = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c._id] = c.name;
    });
    return map;
  }, [categories]);

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setDeletingId(cat._id);
    try {
      await axios.delete(`${API_BASE}/admin/categories/${cat._id}`, {
        withCredentials: true,
      });
      toast({ title: "Category deleted", variant: "success" });
      setCategories((curr) => curr.filter((c) => c._id !== cat._id));
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <AdminPage
        eyebrow="Store"
        title="Categories"
        description="Organize your catalog. Create parent and child categories, and control homepage visibility, featured status, and display order."
        actions={
          <PrimaryButton
            type="button"
            onClick={() => navigate("/admin/categories/new")}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New category
          </PrimaryButton>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d0d0d] px-6 py-16 text-center">
            <FolderTree className="mx-auto mb-3 h-8 w-8 text-[#4d4635]" />
            <p className="text-sm text-gray-400">No categories yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              Create your first category to organize the catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
            <div className="hidden grid-cols-12 gap-4 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 md:grid">
              <span className="col-span-5">Name</span>
              <span className="col-span-3">Parent</span>
              <span className="col-span-2">Order</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            <div className="divide-y divide-white/5">
              {categories.map((c) => (
                <div
                  key={c._id}
                  className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="md:col-span-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{c.name}</span>
                      {c.isFeatured ? (
                        <Star className="h-3.5 w-3.5 text-[#D4AF37]" aria-label="Featured" />
                      ) : null}
                      {c.showOnHome ? (
                        <span className="rounded-sm border border-[#D4AF37]/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[#D4AF37]">
                          Home
                        </span>
                      ) : null}
                      {c.isActive === false ? (
                        <span className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-gray-500">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                    <div className="font-mono text-[11px] text-gray-500">/{c.slug}</div>
                  </div>
                  <div className="text-sm text-gray-400 md:col-span-3">
                    {c.parentCategory ? (
                      nameById[c.parentCategory] || "—"
                    ) : (
                      <span className="text-gray-600">Top level</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 md:col-span-2">{c.sortOrder ?? 0}</div>
                  <div className="flex items-center gap-2 md:col-span-2 md:justify-end">
                    <Link
                      to={`/admin/categories/${c._id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-[#e5e2e1] transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c._id}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 disabled:opacity-50"
                    >
                      {deletingId === c._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}{" "}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminPage>
    </motion.div>
  );
};

export default CategoriesList;
