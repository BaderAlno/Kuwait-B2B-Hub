'use client';
import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, Download, CheckCircle2, AlertTriangle, XCircle,
  FileSpreadsheet, Loader2, Check, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedRow {
  name: string;
  description: string;
  category: string;
  price: number;
  moq: number;
  stock: number;
  tier1_qty: number;
  tier1_price: number;
  tier2_qty: number;
  tier2_price: number;
  image_url: string;
  // validation
  _status: 'valid' | 'warning' | 'error';
  _errors: string[];
  _warnings: string[];
  _raw: Record<string, string>;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';
type DupAction = 'skip' | 'overwrite' | 'keep';

interface ImportResult {
  added: number;
  skipped: number;
  failed: { name: string; reason: string }[];
}

// ─── Column mappings ───────────────────────────────────────────────────────────
const COL_MAP: Record<string, string> = {
  'product name': 'name', 'name': 'name',
  'description': 'description',
  'category': 'category',
  'price (kwd)': 'price', 'price': 'price', 'unit price': 'price',
  'moq': 'moq', 'minimum order quantity': 'moq', 'min order': 'moq',
  'stock quantity': 'stock', 'stock': 'stock', 'quantity': 'stock',
  'bulk price tier 1 qty': 'tier1_qty', 'tier 1 qty': 'tier1_qty',
  'bulk price tier 1 price': 'tier1_price', 'tier 1 price': 'tier1_price',
  'bulk price tier 2 qty': 'tier2_qty', 'tier 2 qty': 'tier2_qty',
  'bulk price tier 2 price': 'tier2_price', 'tier 2 price': 'tier2_price',
  'images (urls)': 'image_url', 'image url': 'image_url', 'image': 'image_url',
};

// ─── Template Generator ────────────────────────────────────────────────────────
function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Products
  const headers = [
    'Product Name', 'Description', 'Category', 'Price (KWD)', 'MOQ',
    'Stock Quantity', 'Bulk Price Tier 1 Qty', 'Bulk Price Tier 1 Price',
    'Bulk Price Tier 2 Qty', 'Bulk Price Tier 2 Price', 'Images (URLs)',
  ];
  const samples = [
    ['Abaya Classic Collection', 'Premium black abaya with golden embroidery', 'Fashion & Apparel', 45.000, 10, 200, 50, 42.000, 100, 38.000, 'https://example.com/abaya.jpg'],
    ['LED Smart TV 55"', '4K UHD Smart TV with built-in streaming apps', 'Electronics & Tech', 180.000, 5, 30, 10, 170.000, 20, 160.000, ''],
    ['Rose Water 500ml', 'Pure distilled rose water for skin care', 'Beauty & Cosmetics', 8.500, 24, 500, 100, 7.500, 200, 6.500, ''],
  ];

  const wsData = [headers, ...samples];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 28 }, { wch: 40 }, { wch: 22 }, { wch: 14 }, { wch: 8 },
    { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 40 },
  ];

  // Style header row (navy bg, white text, bold)
  headers.forEach((_, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!ws[cellRef]) ws[cellRef] = { v: headers[i] };
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1A1A2E' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: 'D4A847' } },
      },
    };
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // Sheet 2: Instructions
  const instrData = [
    ['Column', 'Required?', 'Description'],
    ['Product Name', 'REQUIRED', 'Unique name for the product'],
    ['Description', 'Optional', 'Product description for buyers'],
    ['Category', 'Optional', 'Product category (see Categories sheet)'],
    ['Price (KWD)', 'REQUIRED', 'Base wholesale unit price in Kuwaiti Dinar (e.g. 12.500)'],
    ['MOQ', 'REQUIRED', 'Minimum Order Quantity (whole number, e.g. 10)'],
    ['Stock Quantity', 'REQUIRED', 'Current available stock (whole number)'],
    ['Bulk Price Tier 1 Qty', 'Optional', 'Min quantity for first bulk discount (e.g. 50)'],
    ['Bulk Price Tier 1 Price', 'Optional', 'Discounted price at Tier 1 quantity'],
    ['Bulk Price Tier 2 Qty', 'Optional', 'Min quantity for second bulk discount (e.g. 100)'],
    ['Bulk Price Tier 2 Price', 'Optional', 'Discounted price at Tier 2 quantity'],
    ['Images (URLs)', 'Optional', 'Full URL to product image (https://...)'],
    ['', '', ''],
    ['TIPS', '', ''],
    ['• Prices use 3 decimal places (KWD format)', '', ''],
    ['• MOQ and Stock must be whole numbers', '', ''],
    ['• Leave bulk pricing columns empty if no discount tiers', '', ''],
    ['• Duplicate product names will be skipped by default', '', ''],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  // Sheet 3: Categories
  const categories = [
    ['Valid Categories'],
    ['Fashion & Apparel'],
    ['Electronics & Tech'],
    ['Food & Beverages'],
    ['Beauty & Cosmetics'],
    ['Home & Lifestyle'],
    ['Sports & Outdoors'],
    ['Health & Medical'],
    ['Industrial & B2B'],
    ['Other'],
  ];
  const wsCats = XLSX.utils.aoa_to_sheet(categories);
  wsCats['!cols'] = [{ wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsCats, 'Categories');

  XLSX.writeFile(wb, 'Kuwait_B2B_Hub_Product_Template.xlsx');
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseSheet(data: any[][]): ParsedRow[] {
  if (data.length < 2) return [];
  const rawHeaders = data[0].map((h: any) => String(h || '').trim().toLowerCase());

  return data.slice(1).filter(row => row.some(c => c !== '' && c !== null && c !== undefined)).map(row => {
    const raw: Record<string, string> = {};
    rawHeaders.forEach((h, i) => {
      const mapped = COL_MAP[h];
      if (mapped) raw[mapped] = String(row[i] ?? '').trim();
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    const name = raw.name || '';
    const price = parseFloat(raw.price || '');
    const moq = parseInt(raw.moq || '', 10);
    const stock = parseInt(raw.stock || '', 10);

    if (!name) errors.push('Product Name is required');
    if (!raw.price || isNaN(price) || price <= 0) errors.push('Valid Price is required');
    if (!raw.moq || isNaN(moq) || moq <= 0) errors.push('Valid MOQ is required');
    if (!raw.stock || isNaN(stock) || stock < 0) errors.push('Valid Stock Quantity is required');
    if (!raw.description) warnings.push('No description provided');
    if (!raw.category) warnings.push('No category specified');

    return {
      name,
      description: raw.description || '',
      category: raw.category || '',
      price: isNaN(price) ? 0 : price,
      moq: isNaN(moq) ? 0 : moq,
      stock: isNaN(stock) ? 0 : stock,
      tier1_qty: parseInt(raw.tier1_qty || '', 10) || 0,
      tier1_price: parseFloat(raw.tier1_price || '') || 0,
      tier2_qty: parseInt(raw.tier2_qty || '', 10) || 0,
      tier2_price: parseFloat(raw.tier2_price || '') || 0,
      image_url: raw.image_url || '',
      _status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid',
      _errors: errors,
      _warnings: warnings,
      _raw: raw,
    };
  });
}

// ─── Progress Item ─────────────────────────────────────────────────────────────
function ProgressItem({ name, status, reason }: { name: string; status: 'pending' | 'done' | 'error'; reason?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {status === 'pending' && <Loader2 size={14} style={{ animation: 'spin 0.65s linear infinite', color: 'var(--text-muted)' }} />}
        {status === 'done' && <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />}
        {status === 'error' && <XCircle size={14} style={{ color: 'var(--danger)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {reason && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 1 }}>{reason}</div>}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface CatalogImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CatalogImportModal({ onClose, onSuccess }: CatalogImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dupAction, setDupAction] = useState<DupAction>('skip');
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [progressItems, setProgressItems] = useState<{ name: string; status: 'pending' | 'done' | 'error'; reason?: string }[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter(r => r._status !== 'error');
  const errorCount = rows.filter(r => r._status === 'error').length;
  const warnCount = rows.filter(r => r._status === 'warning').length;

  const processFile = useCallback((file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
        const parsed = parseSheet(raw);
        setRows(parsed);
        setStep('preview');
      } catch {
        alert('Could not parse file. Please use the provided template.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setStep('importing');
    setImportTotal(validRows.length);
    setProgressItems(validRows.map(r => ({ name: r.name, status: 'pending' })));

    // Simulate per-product progress then batch submit
    for (let i = 0; i < validRows.length; i++) {
      await new Promise(r => setTimeout(r, 80));
      setImportProgress(i + 1);
      setProgressItems(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'done' } : item
      ));
    }

    // Batch API call
    const res = await fetch('/api/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: validRows.map(r => ({
          name: r.name, description: r.description, category: r.category,
          price: r.price, moq: r.moq, stock: r.stock,
          tier1_qty: r.tier1_qty || undefined, tier1_price: r.tier1_price || undefined,
          tier2_qty: r.tier2_qty || undefined, tier2_price: r.tier2_price || undefined,
          image_url: r.image_url || undefined,
        })),
        duplicateAction: dupAction,
      }),
    });

    const data: ImportResult = await res.json();
    setResult(data);
    setStep('done');
  };

  const downloadFailedReport = () => {
    if (!result?.failed.length) return;
    const ws = XLSX.utils.json_to_sheet(result.failed.map(f => ({ 'Product Name': f.name, 'Failure Reason': f.reason })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Products');
    XLSX.writeFile(wb, 'import_failed_report.xlsx');
  };

  const pct = importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: 16 }}>
      <div style={{ background: 'var(--bg-white)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--bg-navy-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--navy)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Import Product Catalog</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {step === 'upload' && 'Upload Excel or CSV file'}
                {step === 'preview' && `${rows.length} rows found in ${fileName}`}
                {step === 'importing' && `Importing ${importProgress} of ${importTotal}…`}
                {step === 'done' && 'Import complete'}
              </div>
            </div>
          </div>
          {step !== 'importing' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', padding: '12px 24px', gap: 6, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['upload', 'preview', 'importing', 'done'] as Step[]).map((s, i) => {
            const stepIdx = ['upload', 'preview', 'importing', 'done'].indexOf(step);
            const thisIdx = i;
            const done = stepIdx > thisIdx;
            const active = step === s;
            const labels = ['Upload', 'Preview', 'Import', 'Done'];
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'var(--success)' : active ? 'var(--navy)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done ? <Check size={11} style={{ color: 'white' }} /> : <span style={{ fontSize: 10, fontWeight: 800, color: active ? 'white' : 'var(--text-muted)' }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--navy)' : done ? 'var(--success)' : 'var(--text-muted)' }}>{labels[i]}</span>
                </div>
                {i < 3 && <ChevronRight size={12} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* ── STEP: UPLOAD ── */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                  background: dragging ? 'var(--blue-light)' : 'var(--bg-page)',
                  transition: 'all 0.15s',
                }}
              >
                <Upload size={36} style={{ color: dragging ? 'var(--blue)' : 'var(--text-muted)', marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Drag & drop your Excel or CSV file here
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Supported: .xlsx, .xls, .csv · Max 10MB
                </div>
                <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                  <Upload size={14} /> Choose File
                </button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileInput} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <FileSpreadsheet size={20} style={{ color: 'var(--navy)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Need a template?</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Download our pre-filled Excel template with sample products and instructions.</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ flexShrink: 0 }}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#DCFCE7', borderRadius: 8 }}>
                  <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>{validRows.length} ready</span>
                </div>
                {warnCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEF3C7', borderRadius: 8 }}>
                    <AlertTriangle size={14} style={{ color: '#D97706' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#B45309' }}>{warnCount} warnings</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEE2E2', borderRadius: 8 }}>
                    <XCircle size={14} style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>{errorCount} errors — must fix</span>
                  </div>
                )}
              </div>

              {errorCount > 0 && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={14} /> Fix errors in your file and re-upload to proceed.
                </div>
              )}

              {/* Duplicate action */}
              <div style={{ padding: '12px 16px', background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>If product already exists:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['skip', 'overwrite', 'keep'] as DupAction[]).map(a => (
                    <button key={a} onClick={() => setDupAction(a)} style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                      borderColor: dupAction === a ? 'var(--blue)' : 'var(--border)',
                      background: dupAction === a ? 'var(--blue-light)' : 'transparent',
                      color: dupAction === a ? 'var(--blue)' : 'var(--text-secondary)',
                    }}>
                      {a === 'skip' ? '⏭ Skip (safe)' : a === 'overwrite' ? '✏️ Overwrite' : '➕ Keep Both'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: 320 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-page)', position: 'sticky', top: 0 }}>
                        {['Status', 'Product Name', 'Price (KD)', 'MOQ', 'Stock', 'Issues'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderLeft: `3px solid ${row._status === 'valid' ? '#16A34A' : row._status === 'warning' ? '#D97706' : '#DC2626'}`, borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            {row._status === 'valid' && <CheckCircle2 size={14} style={{ color: '#16A34A' }} />}
                            {row._status === 'warning' && <AlertTriangle size={14} style={{ color: '#D97706' }} />}
                            {row._status === 'error' && <XCircle size={14} style={{ color: '#DC2626' }} />}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--navy)', fontWeight: 700 }}>{row.price > 0 ? `KD ${row.price.toFixed(3)}` : <span style={{ color: 'var(--danger)' }}>Missing</span>}</td>
                          <td style={{ padding: '8px 12px' }}>{row.moq > 0 ? row.moq : <span style={{ color: 'var(--danger)' }}>Missing</span>}</td>
                          <td style={{ padding: '8px 12px' }}>{row.stock >= 0 ? row.stock : <span style={{ color: 'var(--danger)' }}>Missing</span>}</td>
                          <td style={{ padding: '8px 12px', maxWidth: 180 }}>
                            {row._errors.map((e, j) => <div key={j} style={{ color: 'var(--danger)', fontSize: 11 }}>✗ {e}</div>)}
                            {row._warnings.map((w, j) => <div key={j} style={{ color: '#D97706', fontSize: 11 }}>⚠ {w}</div>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-page)', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    Showing first 10 of {rows.length} rows
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setStep('upload'); setRows([]); setFileName(''); }}>
                  ← Re-upload
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={errorCount > 0 || validRows.length === 0} onClick={handleImport}>
                  <Upload size={15} /> Import {validRows.length} Product{validRows.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: IMPORTING ── */}
          {step === 'importing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  <span>Importing product {Math.min(importProgress + 1, importTotal)} of {importTotal}…</span>
                  <span style={{ color: 'var(--navy)' }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--navy)', borderRadius: 99, width: `${pct}%`, transition: 'width 0.15s' }} />
                </div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', maxHeight: 280, overflowY: 'auto', padding: '4px 0' }}>
                {progressItems.map((item, i) => (
                  <div key={i} style={{ padding: '0 16px' }}>
                    <ProgressItem name={item.name} status={item.status} reason={item.reason} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '16px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={36} style={{ color: '#16A34A' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Import Complete!
                </h2>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '5px 12px', background: '#DCFCE7', color: '#15803D', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                    ✓ {result.added} added
                  </span>
                  {result.skipped > 0 && (
                    <span style={{ padding: '5px 12px', background: '#FEF3C7', color: '#B45309', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                      ⏭ {result.skipped} skipped
                    </span>
                  )}
                  {result.failed.length > 0 && (
                    <span style={{ padding: '5px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                      ✗ {result.failed.length} failed
                    </span>
                  )}
                </div>
              </div>

              {result.failed.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={downloadFailedReport}>
                  <Download size={14} /> Download failed items report
                </button>
              )}

              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setStep('upload'); setRows([]); setFileName(''); setResult(null); }}>
                  Import Another File
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onSuccess(); onClose(); }}>
                  View My Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
