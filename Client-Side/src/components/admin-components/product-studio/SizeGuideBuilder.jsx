import React, { useState, useEffect } from 'react';
import { FormField } from '@/components/admin-components/_form/FormField';
import { LuxuryTextarea } from '@/components/admin-components/_form/inputs';

export const SizeGuideBuilder = ({ value, onChange }) => {
  const [mode, setMode] = useState('table'); // 'table' or 'raw'
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState(['Size', 'Chest (cm)', 'Length (cm)']);
  const [rows, setRows] = useState([['XS', '', '']]);
  const [footer, setFooter] = useState('Measurements are approximate and may vary by style.');

  useEffect(() => {
    if (!value) return;
    
    // Simple parsing logic to populate table state if it looks like a table
    const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
    const tableLines = lines.filter(l => l.includes('|'));
    const nonTableLines = lines.filter(l => !l.includes('|'));

    if (tableLines.length >= 2) {
      const parsedRows = tableLines.map(l => l.split('|').map(c => c.trim()));
      setHeaders(parsedRows[0]);
      setRows(parsedRows.slice(1));
      
      // Attempt to split description vs footer
      const firstTableLineIndex = lines.findIndex(l => l === tableLines[0]);
      const lastTableLineIndex = lines.findIndex(l => l === tableLines[tableLines.length - 1]);
      
      setDescription(lines.slice(0, firstTableLineIndex).join('\n'));
      setFooter(lines.slice(lastTableLineIndex + 1).join('\n'));
      setMode('table');
    } else {
      setMode('raw');
    }
  }, [value]);

  const commitTableChanges = (desc, hdrs, rws, ftr) => {
    const d = desc || description;
    const h = hdrs || headers;
    const r = rws || rows;
    const f = ftr || footer;

    let output = [];
    if (d) output.push(d, '');
    output.push(h.join(' | '));
    r.forEach(row => output.push(row.join(' | ')));
    if (f) output.push('', f);
    
    onChange(output.join('\n'));
  };

  const handleHeaderChange = (idx, val) => {
    const next = [...headers];
    next[idx] = val;
    setHeaders(next);
    commitTableChanges(null, next, null, null);
  };

  const handleCellChange = (rIdx, cIdx, val) => {
    const next = [...rows];
    next[rIdx] = [...next[rIdx]];
    next[rIdx][cIdx] = val;
    setRows(next);
    commitTableChanges(null, null, next, null);
  };

  const addRow = () => {
    const next = [...rows, Array(headers.length).fill('')];
    setRows(next);
    commitTableChanges(null, null, next, null);
  };

  const removeRow = (rIdx) => {
    if (rows.length <= 1) return;
    const next = rows.filter((_, i) => i !== rIdx);
    setRows(next);
    commitTableChanges(null, null, next, null);
  };

  const addColumn = () => {
    const nextHeaders = [...headers, 'New Column'];
    const nextRows = rows.map(r => [...r, '']);
    setHeaders(nextHeaders);
    setRows(nextRows);
    commitTableChanges(null, nextHeaders, nextRows, null);
  };

  const removeColumn = (cIdx) => {
    if (headers.length <= 1) return;
    const nextHeaders = headers.filter((_, i) => i !== cIdx);
    const nextRows = rows.map(r => r.filter((_, i) => i !== cIdx));
    setHeaders(nextHeaders);
    setRows(nextRows);
    commitTableChanges(null, nextHeaders, nextRows, null);
  };

  return (
    <FormField label="Size Guide" helper="Manage size guide as a table or raw text">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('table')}
          className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${mode === 'table' ? 'bg-gold-deep text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-panel border border-elevated text-ink/50 hover:text-ink hover:border-ink/20'}`}
        >
          Table Builder
        </button>
        <button
          type="button"
          onClick={() => setMode('raw')}
          className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${mode === 'raw' ? 'bg-gold-deep text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-panel border border-elevated text-ink/50 hover:text-ink hover:border-ink/20'}`}
        >
          Raw Text
        </button>
      </div>

      {mode === 'raw' ? (
        <LuxuryTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder="Size guide content..."
          data-lenis-prevent="true"
        />
      ) : (
        <div className="rounded-xl border border-ink/10 bg-black/40 p-4 space-y-4 overflow-x-auto" data-lenis-prevent="true">
          <input
            type="text"
            className="w-full bg-transparent border-b border-ink/10 px-2 py-1 text-sm text-ink placeholder-ink/30 outline-none focus:border-gold-ink2"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              commitTableChanges(e.target.value, null, null, null);
            }}
          />
          
          <div className="min-w-max">
            <div className="flex gap-2 mb-2">
              {headers.map((h, cIdx) => (
                <div key={cIdx} className="flex-1 min-w-[100px] flex items-center gap-1 bg-ink/5 rounded-md px-2 py-1">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                    className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-gold-ink2 outline-none"
                  />
                  <button type="button" onClick={() => removeColumn(cIdx)} className="text-ink/20 hover:text-rose-400">&times;</button>
                </div>
              ))}
              <button type="button" onClick={addColumn} className="px-2 text-xs text-ink/40 hover:text-ink">+</button>
            </div>

            {rows.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-2 mb-2">
                {row.map((cell, cIdx) => (
                  <div key={cIdx} className="flex-1 min-w-[100px]">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                      className="w-full bg-ink/5 border border-transparent focus:border-ink/20 rounded-md px-2 py-1.5 text-sm text-ink outline-none"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => removeRow(rIdx)} className="px-2 text-ink/20 hover:text-rose-400">&times;</button>
              </div>
            ))}
            <button type="button" onClick={addRow} className="mt-2 px-3 py-1 text-xs uppercase tracking-wider text-gold-ink2 border border-gold-ink2/30 rounded-md hover:bg-gold-deep/10">+ Add Row</button>
          </div>

          <input
            type="text"
            className="w-full bg-transparent border-b border-ink/10 px-2 py-1 text-sm text-ink placeholder-ink/30 outline-none focus:border-gold-ink2 mt-4"
            placeholder="Footer / Notes (optional)"
            value={footer}
            onChange={(e) => {
              setFooter(e.target.value);
              commitTableChanges(null, null, null, e.target.value);
            }}
          />
        </div>
      )}
    </FormField>
  );
};
