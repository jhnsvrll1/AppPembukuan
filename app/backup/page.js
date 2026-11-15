'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Err } from '@/components/ui';
const TABLES = ['customers', 'suppliers', 'vehicles', 'tour_packages', 'bookings', 'booking_costs', 'payments', 'refunds', 'invoices', 'expenses', 'financial_transactions', 'audit_logs'];
const esc = (v) => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export default function Backup() {
  const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  async function dl(t) {
    setBusy(t); setErr('');
    let all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(t).select('*').range(from, from + 999);
      if (error) { setErr(error.message); setBusy(''); return; }
      all = all.concat(data); if (data.length < 1000) break;
    }
    const cols = all.length ? Object.keys(all[0]) : [];
    const csv = [cols.join(','), ...all.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
    a.download = `${t}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setBusy('');
  }
  return (
    <div className="space-y-3"><h1 className="h1">Backup data</h1>
      <p className="muted">Unduh CSV secara berkala (misalnya seminggu sekali) dan simpan di Google Drive sebagai cadangan.</p><Err>{err}</Err>
      <div className="grid gap-2 md:grid-cols-3">{TABLES.map((t) => <button key={t} className="btn btn-ghost" disabled={!!busy} onClick={() => dl(t)}>{busy === t ? 'Mengunduh…' : t}</button>)}</div></div>
  );
}
