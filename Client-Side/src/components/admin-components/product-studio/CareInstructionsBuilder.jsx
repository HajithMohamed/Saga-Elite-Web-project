import React, { useState, useEffect } from 'react';
import { FormField } from '@/components/admin-components/_form/FormField';
import { Waves, RotateCw, Palette, DropletOff, Wind, Sun, Thermometer, Ban, CloudSun, Sparkles, Check } from 'lucide-react';
import { CARE_INSTRUCTION_OPTIONS } from './ProductFormContext';
import { LuxurySelect, LuxuryInput } from '@/components/admin-components/_form/inputs';

const ICON_MAP = {
  Waves, RotateCw, Palette, DropletOff, Wind, Sun, Thermometer, Ban, CloudSun, Sparkles
};

export const CareInstructionsBuilder = ({ value, onChange }) => {
  const [selectedLines, setSelectedLines] = useState([]);
  
  useEffect(() => {
    if (!value) {
      setSelectedLines([]);
      return;
    }
    const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
    setSelectedLines(lines);
  }, [value]);

  const addInstruction = (label) => {
    if (!label) return;
    if (!selectedLines.includes(label)) {
      const next = [...selectedLines, label];
      onChange(next.join('\n'));
    }
  };

  const handleCustomAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      addInstruction(e.target.value.trim());
      e.target.value = '';
    }
  };

  const removeInstruction = (label) => {
    const next = selectedLines.filter(l => l !== label);
    onChange(next.join('\n'));
  };

  return (
    <FormField label="Care Instructions" helper="Select from dropdown or type custom instructions">
      <div className="space-y-3">
        
        {/* Selected Instructions List */}
        {selectedLines.length > 0 && (
          <div className="flex flex-col gap-2">
            {selectedLines.map(line => {
              const matchedOption = CARE_INSTRUCTION_OPTIONS.find(o => o.label === line);
              const IconComp = matchedOption ? ICON_MAP[matchedOption.icon] : Check;
              
              return (
                <div key={line} className="flex items-center justify-between bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white">
                  <div className="flex items-center gap-3">
                    {IconComp && <IconComp className="w-4 h-4 text-[#D4AF37]" />}
                    <span>{line}</span>
                  </div>
                  <button type="button" onClick={() => removeInstruction(line)} className="text-white/40 hover:text-rose-400 text-lg leading-none transition-colors">
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Dropdown for Standard Instructions */}
        <LuxurySelect
          value=""
          onChange={(e) => addInstruction(e.target.value)}
        >
          <option value="" disabled className="bg-[#0f1014] text-white/50">Select instruction from dropdown...</option>
          {CARE_INSTRUCTION_OPTIONS.map((option) => (
            <option 
              key={option.id} 
              value={option.label}
              disabled={selectedLines.includes(option.label)}
              className="bg-[#0f1014] text-white disabled:text-white/20"
            >
              {option.label}
            </option>
          ))}
        </LuxurySelect>

        {/* Custom Add */}
        <LuxuryInput
          type="text"
          placeholder="Or type custom instruction and press Enter..."
          onKeyDown={handleCustomAdd}
        />
      </div>
    </FormField>
  );
};
