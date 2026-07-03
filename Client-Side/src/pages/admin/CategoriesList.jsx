import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  FolderTree,
  Folder,
  FolderOpen,
  Star,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
import CategoryEditorPanel from "./CategoryEditor";

const CategoriesList = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createParentId, setCreateParentId] = useState("");
  const seededExpand = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const list = res.data?.data || [];
      setCategories(list);
      // On the very first load, open the main categories so the tree shows structure.
      if (!seededExpand.current) {
        seededExpand.current = true;
        setExpanded(
          new Set(list.filter((c) => !c.parentCategory).map((c) => String(c._id)))
        );
      }
      return list;
    } catch (err) {
      toast({
        title: "Could not load categories",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => {
    const m = new Map();
    categories.forEach((c) => m.set(String(c._id), c));
    return m;
  }, [categories]);

  // parentId → sorted children (root-level under the "root" key).
  const childrenMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => {
      const key = c.parentCategory ? String(c.parentCategory) : "root";
      (m[key] = m[key] || []).push(c);
    });
    Object.values(m).forEach((arr) =>
      arr.sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          String(a.name).localeCompare(String(b.name))
      )
    );
    return m;
  }, [categories]);

  // Total descendants per node (for the count pill).
  const descCount = useMemo(() => {
    const map = {};
    const compute = (id) => {
      let total = 0;
      (childrenMap[id] || []).forEach((ch) => {
        total += 1 + compute(String(ch._id));
      });
      map[id] = total;
      return total;
    };
    (childrenMap.root || []).forEach((r) => compute(String(r._id)));
    return map;
  }, [childrenMap]);

  // Search → set of ids to show (matches plus their ancestors); null = no filter.
  const matchIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const set = new Set();
    categories.forEach((c) => {
      if (
        c.name?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
      ) {
        set.add(String(c._id));
      }
    });
    [...set].forEach((id) => {
      let cur = byId.get(id);
      let guard = 0;
      while (cur?.parentCategory && guard < 20) {
        set.add(String(cur.parentCategory));
        cur = byId.get(String(cur.parentCategory));
        guard += 1;
      }
    });
    return set;
  }, [search, categories, byId]);

  const expandAncestors = useCallback(
    (id, list) => {
      const map = new Map((list || categories).map((c) => [String(c._id), c]));
      setExpanded((prev) => {
        const next = new Set(prev);
        let cur = map.get(String(id));
        let guard = 0;
        while (cur?.parentCategory && guard < 20) {
          next.add(String(cur.parentCategory));
          cur = map.get(String(cur.parentCategory));
          guard += 1;
        }
        return next;
      });
    },
    [categories]
  );

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectNode = (id) => {
    setCreating(false);
    setSelectedId(String(id));
  };

  const startNew = (parentId = "") => {
    setCreateParentId(parentId ? String(parentId) : "");
    setSelectedId(null);
    setCreating(true);
    if (parentId) expandAncestors(parentId);
  };

  const handleSaved = async (savedId) => {
    const fresh = await load();
    setCreating(false);
    if (savedId) {
      setSelectedId(String(savedId));
      expandAncestors(savedId, fresh);
    }
  };

  const handleDeleted = async () => {
    await load();
    setCreating(false);
    setSelectedId(null);
  };

  const handleCancel = () => {
    setCreating(false);
  };

  const selectedCategory = useMemo(
    () => (selectedId ? byId.get(String(selectedId)) || null : null),
    [selectedId, byId]
  );

  const renderNodes = (parentKey, depth) => {
    const kids = childrenMap[parentKey] || [];
    return kids
      .filter((c) => !matchIds || matchIds.has(String(c._id)))
      .map((c) => {
        const id = String(c._id);
        const hasKids = (childrenMap[id] || []).length > 0;
        const opened = matchIds ? true : expanded.has(id);
        const selected = String(selectedId) === id && !creating;
        const count = descCount[id] || 0;
        return (
          <div key={id}>
            <div
              onClick={() => selectNode(id)}
              style={{ paddingLeft: `${8 + depth * 16}px` }}
              className={`group flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition ${
                selected
                  ? "border border-gold-ink2/45 bg-gold-deep/[0.12]"
                  : "border border-transparent hover:bg-ink/[0.03]"
              }`}
            >
              {hasKids ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(id);
                  }}
                  aria-label={opened ? "Collapse" : "Expand"}
                  className="grid h-5 w-5 place-items-center rounded text-gray-500 hover:text-gray-300"
                >
                  {opened ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}

              {hasKids ? (
                opened ? (
                  <FolderOpen
                    className={`h-4 w-4 shrink-0 ${
                      depth === 0 ? "text-gold-ink2" : "text-gray-500"
                    }`}
                  />
                ) : (
                  <Folder
                    className={`h-4 w-4 shrink-0 ${
                      depth === 0 ? "text-gold-ink2" : "text-gray-500"
                    }`}
                  />
                )
              ) : (
                <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-700" />
              )}

              <span
                className={`min-w-0 flex-1 truncate ${
                  selected
                    ? "text-gold-ink"
                    : depth === 0
                      ? "font-medium text-ink"
                      : "text-gray-300"
                }`}
              >
                {c.name}
              </span>

              {depth === 0 ? (
                <span className="hidden rounded-sm border border-ink/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-gray-500 sm:inline">
                  Main
                </span>
              ) : null}
              {c.isFeatured ? (
                <Star className="h-3.5 w-3.5 text-gold-ink2" aria-label="Featured" />
              ) : null}
              {c.isActive === false ? (
                <span className="rounded-sm border border-ink/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  Off
                </span>
              ) : null}
              {hasKids ? (
                <span className="min-w-[20px] text-right text-[11px] text-gray-600">
                  {count}
                </span>
              ) : null}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startNew(id);
                }}
                aria-label={`Add subcategory under ${c.name}`}
                title={`Add subcategory under ${c.name}`}
                className="grid h-5 w-5 place-items-center rounded text-gray-600 opacity-0 transition hover:text-gold-ink2 group-hover:opacity-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {hasKids && opened ? renderNodes(id, depth + 1) : null}
          </div>
        );
      });
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <AdminPage
        eyebrow="Store"
        title="Categories"
        description="Build your catalog tree. Create a main category (Gents, Ladies, Unisex…), then select it and use “Add subcategory” to nest items beneath it. Click any node to edit it."
        actions={
          <PrimaryButton
            type="button"
            onClick={() => startNew("")}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New category
          </PrimaryButton>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold-ink2" />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/10 bg-page px-6 py-16 text-center">
            <FolderTree className="mx-auto mb-3 h-8 w-8 text-line" />
            <p className="text-sm text-gray-400">No categories yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              Create your first main category (e.g. Gents) to organize the catalog.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => startNew("")}
              className="mt-5 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New category
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
            {/* Tree */}
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-page">
              <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-gray-600"
                />
              </div>
              <div className="max-h-[72vh] overflow-y-auto p-2">
                {matchIds && matchIds.size === 0 ? (
                  <p className="px-2 py-8 text-center text-sm text-gray-500">
                    No categories match “{search}”.
                  </p>
                ) : (
                  renderNodes("root", 0)
                )}
              </div>
              <div className="border-t border-ink/10 px-3 py-2 text-[11px] leading-relaxed text-gray-600">
                Hover a category and click{" "}
                <Plus className="inline h-3 w-3 -translate-y-px text-gray-400" /> to
                nest a subcategory beneath it.
              </div>
            </div>

            {/* Editor / detail */}
            <div className="rounded-2xl border border-ink/10 bg-page p-5 sm:p-6">
              {creating ? (
                <CategoryEditorPanel
                  key={`new:${createParentId}`}
                  category={null}
                  categories={categories}
                  defaultParentId={createParentId}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                  onCancel={handleCancel}
                />
              ) : selectedCategory ? (
                <CategoryEditorPanel
                  key={String(selectedCategory._id)}
                  category={selectedCategory}
                  categories={categories}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                  onCancel={handleCancel}
                  onAddChild={(id) => startNew(id)}
                />
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <FolderTree className="mb-3 h-9 w-9 text-line" />
                  <p className="text-sm text-gray-400">
                    Select a category from the tree to edit it.
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Or create a new one — use the button above, or “+” on any branch
                    to nest beneath it.
                  </p>
                  <PrimaryButton
                    type="button"
                    onClick={() => startNew("")}
                    className="mt-5 inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> New category
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminPage>
    </motion.div>
  );
};

export default CategoriesList;
