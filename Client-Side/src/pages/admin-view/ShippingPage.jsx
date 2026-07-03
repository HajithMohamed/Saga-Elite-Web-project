import React, { useCallback, useEffect, useState } from "react";
import {
  Truck,
  Plus,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Pencil,
  X,
  MapPin,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { AdminPage } from "@/components/admin-components/AdminUI";

const PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
];

const initialZone = {
  name: "",
  provinces: [],
  deliveryFee: 0,
  estimatedDays: "1–3 business days",
  freeAbove: 0,
  displayOrder: 0,
  isActive: true,
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 });

const ZoneRow = ({ zone, onToggleProvince, onChange, onSave, saving }) => (
  <div className="border border-elevated bg-panel p-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted">
          Zone name
        </label>
        <input
          type="text"
          value={zone.name}
          onChange={(e) => onChange({ ...zone, name: e.target.value })}
          className="w-full border border-elevated bg-page p-2.5 text-sm text-ink focus:border-gold-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted">
          Delivery fee (LKR)
        </label>
        <input
          type="number"
          min="0"
          value={zone.deliveryFee}
          onChange={(e) =>
            onChange({ ...zone, deliveryFee: Number(e.target.value) })
          }
          className="w-full border border-elevated bg-page p-2.5 text-sm text-ink focus:border-gold-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted">
          Free above (0 = never)
        </label>
        <input
          type="number"
          min="0"
          value={zone.freeAbove}
          onChange={(e) =>
            onChange({ ...zone, freeAbove: Number(e.target.value) })
          }
          className="w-full border border-elevated bg-page p-2.5 text-sm text-ink focus:border-gold-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted">
          Estimated delivery
        </label>
        <input
          type="text"
          value={zone.estimatedDays}
          onChange={(e) =>
            onChange({ ...zone, estimatedDays: e.target.value })
          }
          className="w-full border border-elevated bg-page p-2.5 text-sm text-ink focus:border-gold-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted">
          Display order
        </label>
        <input
          type="number"
          value={zone.displayOrder}
          onChange={(e) =>
            onChange({ ...zone, displayOrder: Number(e.target.value) })
          }
          className="w-full border border-elevated bg-page p-2.5 text-sm text-ink focus:border-gold-ink focus:outline-none"
        />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cream">
          <input
            type="checkbox"
            checked={!!zone.isActive}
            onChange={(e) =>
              onChange({ ...zone, isActive: e.target.checked })
            }
          />
          Active
        </label>
      </div>
    </div>

    <div className="mt-4">
      <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted">
        Applicable provinces
      </label>
      <div className="flex flex-wrap gap-2">
        {PROVINCES.map((p) => {
          const active = (zone.provinces || []).includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => onToggleProvince(zone, p)}
              className={`px-3 py-1 text-[10px] uppercase tracking-[0.18em] border ${
                active
                  ? "border-gold-ink bg-gold/10 text-gold-ink"
                  : "border-line text-muted hover:border-cream"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-muted">
        Customers see:{" "}
        <span className="text-cream">
          {zone.deliveryFee === 0
            ? "Free delivery"
            : `LKR ${formatCurrency(zone.deliveryFee)}`}
        </span>
        {zone.freeAbove > 0 ? (
          <>
            <span className="mx-1">·</span>
            <span className="text-cream">
              free above LKR {formatCurrency(zone.freeAbove)}
            </span>
          </>
        ) : null}
        <span className="mx-1">·</span>
        <span className="text-cream">{zone.estimatedDays}</span>
      </p>
      <button
        type="button"
        onClick={() => onSave(zone)}
        disabled={saving === zone._id}
        className="inline-flex items-center gap-2 bg-gold px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ongold hover:bg-gold-hover disabled:opacity-60"
      >
        {saving === zone._id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save zone
      </button>
    </div>
  </div>
);

const ZoneCard = ({ zone, onEdit }) => (
  <div className="flex flex-col border border-elevated bg-panel p-5 transition-colors hover:border-line">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-ink">
          {zone.name}
        </h3>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted">
          {zone.estimatedDays}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${
          zone.isActive
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
            : "border-line bg-page text-muted"
        }`}
      >
        {zone.isActive ? "Active" : "Inactive"}
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="border border-elevated bg-page p-3">
        <p className="text-[9px] uppercase tracking-[0.22em] text-muted">
          Delivery fee
        </p>
        <p className="mt-1 text-sm font-semibold text-gold-ink">
          {Number(zone.deliveryFee) === 0
            ? "Free delivery"
            : `LKR ${formatCurrency(zone.deliveryFee)}`}
        </p>
      </div>
      <div className="border border-elevated bg-page p-3">
        <p className="text-[9px] uppercase tracking-[0.22em] text-muted">
          Free above
        </p>
        <p className="mt-1 text-sm font-semibold text-cream">
          {Number(zone.freeAbove) > 0
            ? `LKR ${formatCurrency(zone.freeAbove)}`
            : "—"}
        </p>
      </div>
    </div>

    <div className="mt-4 flex-1">
      <p className="mb-2 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-muted">
        <MapPin className="h-3 w-3" /> Provinces
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(zone.provinces || []).length === 0 ? (
          <span className="text-[10px] italic text-muted">
            No provinces assigned
          </span>
        ) : (
          (zone.provinces || []).map((p) => (
            <span
              key={p}
              className="border border-line px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cream"
            >
              {p}
            </span>
          ))
        )}
      </div>
    </div>

    <div className="mt-4 flex justify-end border-t border-elevated pt-3">
      <button
        type="button"
        onClick={() => onEdit(zone)}
        className="inline-flex items-center gap-2 border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cream transition-colors hover:border-gold-ink hover:text-gold-ink"
      >
        <Pencil className="h-3 w-3" /> Edit zone
      </button>
    </div>
  </div>
);

const ShippingPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [newZone, setNewZone] = useState(initialZone);
  const [editingId, setEditingId] = useState(null);
  const [draftZone, setDraftZone] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance
        .get(`/shipping-zones/admin`)
        .catch(() => ({ data: { data: { zones: [] } } }));
      setZones(res.data?.data?.zones || []);
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
    fetchZones();
  }, [fetchZones]);

  const updateZoneInList = (updated) => {
    setZones((prev) =>
      prev.map((z) => (z._id === updated._id ? { ...z, ...updated } : z))
    );
  };

  const handleSaveZone = async (zone) => {
    setSavingId(zone._id);
    try {
      const payload = {
        name: zone.name,
        provinces: zone.provinces,
        deliveryFee: Number(zone.deliveryFee) || 0,
        estimatedDays: zone.estimatedDays,
        freeAbove: Number(zone.freeAbove) || 0,
        displayOrder: Number(zone.displayOrder) || 0,
        isActive: !!zone.isActive,
      };
      const res = await axiosInstance.patch(
        `/shipping-zones/admin/${zone._id}`,
        payload
      );
      const updated = res.data?.data?.zone || zone;
      updateZoneInList(updated);
      setEditingId(null);
      setDraftZone(null);
      toast({ title: "Zone saved" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const startEditZone = (zone) => {
    setEditingId(zone._id);
    setDraftZone({ ...zone, provinces: [...(zone.provinces || [])] });
  };

  const cancelEditZone = () => {
    setEditingId(null);
    setDraftZone(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newZone.name.trim()) {
      toast({ title: "Zone name is required", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      const res = await axiosInstance.post(`/shipping-zones/admin`, {
        ...newZone,
        deliveryFee: Number(newZone.deliveryFee) || 0,
        freeAbove: Number(newZone.freeAbove) || 0,
        displayOrder: Number(newZone.displayOrder) || 0,
      });
      setZones((prev) => [...prev, res.data?.data?.zone]);
      setNewZone(initialZone);
      setShowCreate(false);
      toast({ title: "Zone added" });
    } catch (err) {
      toast({
        title: "Could not create",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const onToggleProvince = (zone, province) => {
    const currentProvinces = zone.provinces || [];
    const next = currentProvinces.includes(province)
      ? currentProvinces.filter((p) => p !== province)
      : [...currentProvinces, province];
    if (zone._id) {
      setDraftZone({ ...zone, provinces: next });
    } else {
      setNewZone({ ...zone, provinces: next });
    }
  };

  return (
    <AdminPage
      eyebrow="Operations"
      title="Shipping Zones"
      description="Delivery fees, regions, and free-shipping thresholds. Customers see the matching zone at checkout."
      actions={<Truck className="h-5 w-5 text-gold-ink" />}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <p className="rounded-md border border-line/40 bg-panel p-3 text-xs text-muted">
          Zones are deactivated, never deleted, so historical orders keep their
          fee context. Use the toggle to take a zone offline.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold-ink" />
          </div>
        ) : (
          <>
            {zones.length === 0 ? (
              <div className="border border-dashed border-elevated bg-page p-12 text-center text-xs uppercase tracking-widest text-muted">
                No shipping zones configured yet. Add your first below.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {zones.map((zone) =>
                  editingId === zone._id && draftZone ? (
                    <div
                      key={zone._id}
                      className="md:col-span-2 border border-gold-ink/40 bg-panel"
                    >
                      <div className="flex items-center justify-between border-b border-elevated px-5 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gold-ink">
                          Editing — {zone.name}
                        </p>
                        <button
                          type="button"
                          onClick={cancelEditZone}
                          className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-cream hover:text-cream"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                      </div>
                      <ZoneRow
                        zone={draftZone}
                        onChange={setDraftZone}
                        onToggleProvince={onToggleProvince}
                        onSave={handleSaveZone}
                        saving={savingId}
                      />
                    </div>
                  ) : (
                    <ZoneCard key={zone._id} zone={zone} onEdit={startEditZone} />
                  )
                )}
              </div>
            )}

            {showCreate ? (
              <form
                onSubmit={handleCreate}
                className="border border-gold-ink/30 bg-panel p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
                    <Plus className="h-4 w-4" /> Add new zone
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setNewZone(initialZone);
                    }}
                    className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-cream hover:text-cream"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
                <ZoneRow
                  zone={{ ...newZone, _id: null }}
                  onChange={(updated) =>
                    setNewZone({ ...updated, _id: undefined })
                  }
                  onToggleProvince={onToggleProvince}
                  onSave={() => {}}
                  saving={null}
                />
                <div className="mt-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 bg-gold px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-ongold hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create zone
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 border border-gold-ink/40 bg-panel px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-gold-ink transition-colors hover:bg-gold/10"
              >
                <Plus className="h-4 w-4" /> Add new zone
              </button>
            )}

            <div className="border border-elevated bg-panel p-5 text-xs">
              <p className="mb-2 font-mono uppercase tracking-[0.26em] text-muted">
                Storefront integration status
              </p>
              <p className="flex items-center gap-2 text-cream">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Public list:{" "}
                <span className="font-mono text-[10px]">
                  GET /api/v1/shipping-zones
                </span>{" "}
                live
              </p>
              <p className="mt-1 flex items-center gap-2 text-cream">
                <XCircle className="h-4 w-4 text-danger-ink" />
                Checkout integration: pending — customer-facing zone selector +
                cart-total fee will land in a follow-up PR.
              </p>
            </div>
          </>
        )}
      </div>
    </AdminPage>
  );
};

export default ShippingPage;
