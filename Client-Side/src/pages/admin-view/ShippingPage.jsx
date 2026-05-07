import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Truck,
  Plus,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
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
  <div className="border border-[#2a2a2a] bg-[#131313] p-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          Zone name
        </label>
        <input
          type="text"
          value={zone.name}
          onChange={(e) => onChange({ ...zone, name: e.target.value })}
          className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          Delivery fee (LKR)
        </label>
        <input
          type="number"
          min="0"
          value={zone.deliveryFee}
          onChange={(e) =>
            onChange({ ...zone, deliveryFee: Number(e.target.value) })
          }
          className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          Free above (0 = never)
        </label>
        <input
          type="number"
          min="0"
          value={zone.freeAbove}
          onChange={(e) =>
            onChange({ ...zone, freeAbove: Number(e.target.value) })
          }
          className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          Estimated delivery
        </label>
        <input
          type="text"
          value={zone.estimatedDays}
          onChange={(e) =>
            onChange({ ...zone, estimatedDays: e.target.value })
          }
          className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          Display order
        </label>
        <input
          type="number"
          value={zone.displayOrder}
          onChange={(e) =>
            onChange({ ...zone, displayOrder: Number(e.target.value) })
          }
          className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 text-sm text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
        />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#d0c5af]">
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
      <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
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
                  ? "border-[#f2ca50] bg-[#f2ca50]/10 text-[#f2ca50]"
                  : "border-[#4d4635] text-[#99907c] hover:border-[#d0c5af]"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-[#666]">
        Customers see:{" "}
        <span className="text-[#d0c5af]">
          {zone.deliveryFee === 0
            ? "Free delivery"
            : `LKR ${formatCurrency(zone.deliveryFee)}`}
        </span>
        {zone.freeAbove > 0 ? (
          <>
            <span className="mx-1">·</span>
            <span className="text-[#d0c5af]">
              free above LKR {formatCurrency(zone.freeAbove)}
            </span>
          </>
        ) : null}
        <span className="mx-1">·</span>
        <span className="text-[#d0c5af]">{zone.estimatedDays}</span>
      </p>
      <button
        type="button"
        onClick={() => onSave(zone)}
        disabled={saving === zone._id}
        className="inline-flex items-center gap-2 bg-[#f2ca50] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:opacity-60"
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

const ShippingPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [newZone, setNewZone] = useState(initialZone);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios
        .get(`${API_BASE}/shipping-zones/admin`, { withCredentials: true })
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
      const res = await axios.patch(
        `${API_BASE}/shipping-zones/admin/${zone._id}`,
        payload,
        { withCredentials: true }
      );
      const updated = res.data?.data?.zone || zone;
      updateZoneInList(updated);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newZone.name.trim()) {
      toast({ title: "Zone name is required", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      const res = await axios.post(
        `${API_BASE}/shipping-zones/admin`,
        {
          ...newZone,
          deliveryFee: Number(newZone.deliveryFee) || 0,
          freeAbove: Number(newZone.freeAbove) || 0,
          displayOrder: Number(newZone.displayOrder) || 0,
        },
        { withCredentials: true }
      );
      setZones((prev) => [...prev, res.data?.data?.zone]);
      setNewZone(initialZone);
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
      updateZoneInList({ ...zone, provinces: next });
    } else {
      setNewZone({ ...zone, provinces: next });
    }
  };

  return (
    <AdminPage
      eyebrow="Operations"
      title="Shipping Zones"
      description="Delivery fees, regions, and free-shipping thresholds. Customers see the matching zone at checkout."
      actions={<Truck className="h-5 w-5 text-[#f2ca50]" />}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <p className="rounded-md border border-[#4d4635]/40 bg-[#131313] p-3 text-xs text-[#99907c]">
          Zones are deactivated, never deleted, so historical orders keep their
          fee context. Use the toggle to take a zone offline.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
          </div>
        ) : (
          <>
            {zones.length === 0 ? (
              <div className="border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-12 text-center text-xs uppercase tracking-widest text-[#888]">
                No shipping zones configured yet. Add your first below.
              </div>
            ) : (
              <div className="space-y-4">
                {zones.map((zone) => (
                  <ZoneRow
                    key={zone._id}
                    zone={zone}
                    onChange={updateZoneInList}
                    onToggleProvince={onToggleProvince}
                    onSave={handleSaveZone}
                    saving={savingId}
                  />
                ))}
              </div>
            )}

            <form
              onSubmit={handleCreate}
              className="border border-[#f2ca50]/30 bg-[#131313] p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
                <Plus className="h-4 w-4" /> Add new zone
              </h3>
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
                  className="inline-flex items-center gap-2 bg-[#f2ca50] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="border border-[#2a2a2a] bg-[#131313] p-5 text-xs">
              <p className="mb-2 font-mono uppercase tracking-[0.26em] text-[#99907c]">
                Storefront integration status
              </p>
              <p className="flex items-center gap-2 text-[#d0c5af]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Public list:{" "}
                <span className="font-mono text-[10px]">
                  GET /api/v1/shipping-zones
                </span>{" "}
                live
              </p>
              <p className="mt-1 flex items-center gap-2 text-[#d0c5af]">
                <XCircle className="h-4 w-4 text-[#ffb4ab]" />
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
