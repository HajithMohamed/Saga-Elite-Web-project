import React, { useState, useMemo, useEffect } from 'react';
import {
  useProductForm,
  MATERIAL_OPTIONS,
  GSM_OPTIONS,
  SIZE_GUIDE_PRESETS,
  FIT_OPTIONS,
  CUSTOM_OPTION,
  findPresetByValue,
  parseSizeGuideTable,
} from './ProductFormContext';
import { FormField } from '@/components/admin-components/_form/FormField';
import { LuxuryInput, LuxurySelect, LuxuryTextarea } from '@/components/admin-components/_form/inputs';
import { CareInstructionsBuilder } from './CareInstructionsBuilder';
import { SizeGuideBuilder } from './SizeGuideBuilder';
import axiosInstance from '@/api/axiosInstance';

export const OverviewSection = ({ drops = [] }) => {
  const { formData, updateField, validationErrors } = useProductForm();

  const [brandOptions, setBrandOptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const brandsRes = await axiosInstance.get('/brands');
        if (!mounted) return;
        setBrandOptions(brandsRes.data?.data || []);
      } catch {
        // Picker degrades to free-text input when the list can't load.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [fabricSelection, setFabricSelection] = useState(() =>
    formData.fabric
      ? MATERIAL_OPTIONS.includes(formData.fabric)
        ? formData.fabric
        : CUSTOM_OPTION
      : ''
  );

  const [gsmSelection, setGsmSelection] = useState(() =>
    formData.gsm
      ? GSM_OPTIONS.includes(String(formData.gsm))
        ? String(formData.gsm)
        : CUSTOM_OPTION
      : ''
  );

  const [fitSelection, setFitSelection] = useState(() =>
    formData.fitType
      ? FIT_OPTIONS.includes(formData.fitType)
        ? formData.fitType
        : CUSTOM_OPTION
      : ''
  );

  const [sizeGuideSelection, setSizeGuideSelection] = useState(() => {
    const matched = findPresetByValue(formData.sizeGuide, SIZE_GUIDE_PRESETS);
    if (matched) return matched.value;
    return formData.sizeGuide ? CUSTOM_OPTION : '';
  });

  const sizeTable = useMemo(() => parseSizeGuideTable(formData.sizeGuide), [formData.sizeGuide]);

  const handleFabricSelectionChange = (value) => {
    setFabricSelection(value);
    if (!value || value === CUSTOM_OPTION) {
      updateField('fabric', '');
      return;
    }
    updateField('fabric', value);
  };

  const handleFabricTextChange = (value) => {
    setFabricSelection(CUSTOM_OPTION);
    updateField('fabric', value);
  };

  const handleGsmSelectionChange = (value) => {
    setGsmSelection(value);
    if (!value || value === CUSTOM_OPTION) {
      updateField('gsm', '');
      return;
    }
    updateField('gsm', value);
  };

  const handleGsmTextChange = (value) => {
    setGsmSelection(CUSTOM_OPTION);
    updateField('gsm', value);
  };

  const handleFitSelectionChange = (value) => {
    setFitSelection(value);
    if (!value || value === CUSTOM_OPTION) {
      updateField('fitType', '');
      return;
    }
    updateField('fitType', value);
  };

  const handleFitTextChange = (value) => {
    setFitSelection(CUSTOM_OPTION);
    updateField('fitType', value);
  };

  const handleSizeGuideSelectionChange = (value) => {
    setSizeGuideSelection(value);
    if (!value || value === CUSTOM_OPTION) return;
    const preset = findPresetByValue(value, SIZE_GUIDE_PRESETS);
    if (preset) updateField('sizeGuide', preset.guide);
  };

  const handleSizeGuideTextChange = (value) => {
    setSizeGuideSelection(CUSTOM_OPTION);
    updateField('sizeGuide', value);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-white">Product Overview</h2>

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Product Name"
            required
            error={validationErrors.name}
            maxLength={200}
            showCount
            value={formData.name}
          >
            <LuxuryInput
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Signature Heavyweight Hoodie"
              maxLength={200}
              error={!!validationErrors.name}
            />
          </FormField>
          <FormField label="Article No" required helper="Used for SKU generation">
            <LuxuryInput
              value={formData.artNo}
              onChange={(e) => updateField('artNo', e.target.value)}
              placeholder="e.g. SE-HD-001"
            />
          </FormField>
        </div>

        <FormField
          label="Description"
          helper="Detailed product description for the storefront"
          maxLength={2000}
          showCount
          value={formData.description}
        >
          <LuxuryTextarea
            data-lenis-prevent="true"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            maxLength={2000}
            rows={8}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="[&::-webkit-scrollbar]:hidden"
            placeholder="Detailed product description..."
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Fabric / Material">
            <LuxurySelect
              value={fabricSelection}
              onChange={(e) => handleFabricSelectionChange(e.target.value)}
            >
              <option value="" className="bg-[#0f1014] text-white">Select material...</option>
              {MATERIAL_OPTIONS.map((material) => (
                <option key={material} value={material} className="bg-[#0f1014] text-white">
                  {material}
                </option>
              ))}
              <option value={CUSTOM_OPTION} className="bg-[#0f1014] text-[#D4AF37]">Custom / Other...</option>
            </LuxurySelect>
            {(fabricSelection === CUSTOM_OPTION || (formData.fabric && !MATERIAL_OPTIONS.includes(formData.fabric))) && (
              <LuxuryInput
                className="mt-2"
                value={formData.fabric}
                onChange={(e) => handleFabricTextChange(e.target.value)}
                placeholder="Custom fabric name"
              />
            )}
          </FormField>

          <FormField label="GSM">
            <LuxurySelect
              value={gsmSelection}
              onChange={(e) => handleGsmSelectionChange(e.target.value)}
            >
              <option value="" className="bg-[#0f1014] text-white">Select GSM...</option>
              {GSM_OPTIONS.map((gsm) => (
                <option key={gsm} value={gsm} className="bg-[#0f1014] text-white">
                  {gsm}
                </option>
              ))}
              <option value={CUSTOM_OPTION} className="bg-[#0f1014] text-[#D4AF37]">Custom...</option>
            </LuxurySelect>
            {(gsmSelection === CUSTOM_OPTION || (formData.gsm && !GSM_OPTIONS.includes(String(formData.gsm)))) && (
              <LuxuryInput
                className="mt-2"
                value={formData.gsm}
                onChange={(e) => handleGsmTextChange(e.target.value)}
                placeholder="e.g. 400"
              />
            )}
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Brand">
            <LuxuryInput
              value={formData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="e.g. Sovereign Elite"
              list="product-brand-options"
            />
            <datalist id="product-brand-options">
              {brandOptions.map((brand) => (
                <option key={brand._id} value={brand.name} />
              ))}
            </datalist>
            {brandOptions.length > 0 ? (
              <p className="mt-1.5 text-[10px] text-white/40">
                Pick from the brand list (Store → Brands) or type a new name.
              </p>
            ) : null}
          </FormField>
          <FormField label="Collection Drop">
            <LuxurySelect
              value={formData.drop}
              onChange={(e) => updateField('drop', e.target.value)}
            >
              <option value="" className="bg-[#0f1014] text-white">Select Drop...</option>
              {drops.map((d) => (
                <option key={d._id} value={d._id} className="bg-[#0f1014] text-white">
                  {d.name}
                </option>
              ))}
            </LuxurySelect>
          </FormField>
        </div>

        <FormField
          label="Product Story (Optional)"
          maxLength={3000}
          showCount
          value={formData.story}
        >
          <LuxuryTextarea
            data-lenis-prevent="true"
            value={formData.story}
            onChange={(e) => updateField('story', e.target.value)}
            maxLength={3000}
            rows={6}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="[&::-webkit-scrollbar]:hidden"
            placeholder="The inspiration behind this piece..."
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Fit Type">
            <LuxurySelect
              value={fitSelection}
              onChange={(e) => handleFitSelectionChange(e.target.value)}
            >
              <option value="" className="bg-[#0f1014] text-white">Select fit...</option>
              {FIT_OPTIONS.map((fit) => (
                <option key={fit} value={fit} className="bg-[#0f1014] text-white">
                  {fit}
                </option>
              ))}
              <option value={CUSTOM_OPTION} className="bg-[#0f1014] text-[#D4AF37]">Custom...</option>
            </LuxurySelect>
            {(fitSelection === CUSTOM_OPTION || (formData.fitType && !FIT_OPTIONS.includes(formData.fitType))) && (
              <LuxuryInput
                className="mt-2"
                value={formData.fitType}
                onChange={(e) => handleFitTextChange(e.target.value)}
                placeholder="e.g. Unique Fit"
              />
            )}
          </FormField>
          <CareInstructionsBuilder
            value={formData.careInstructions}
            onChange={(val) => updateField('careInstructions', val)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Size Guide Preset</label>
            <LuxurySelect
              value={sizeGuideSelection}
              onChange={(e) => handleSizeGuideSelectionChange(e.target.value)}
              className="w-48 text-xs py-1"
            >
              <option value="" className="bg-[#0f1014] text-white">No preset</option>
              {SIZE_GUIDE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value} className="bg-[#0f1014] text-white">
                  {preset.label}
                </option>
              ))}
              <option value={CUSTOM_OPTION} className="bg-[#0f1014] text-[#D4AF37]">Custom...</option>
            </LuxurySelect>
          </div>

          <SizeGuideBuilder
            value={formData.sizeGuide}
            onChange={(val) => {
              handleSizeGuideTextChange(val);
            }}
          />
        </div>
      </div>
    </div>
  );
};
