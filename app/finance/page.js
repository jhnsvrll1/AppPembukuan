'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { rp, tgl, dateStr, todayISO } from '@/lib/format';
import { Err } from '@/components/ui';
const CATS = ['Gaji dan honor', 'Marketing', 'Operasional', 'Maintenance', 'Administrasi', 'Lainnya'];

export default function Finance() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [tx, setTx] = useState([]); const [rows, setRows] = useState([]); const [err, setErr] = useState('');
  const [ef, setEf] = useState({ category: CATS[0], description: '', amount: '', expense_date: todayISO() });
  const first = dateStr(new Date(ym.y, ym.m, 1)); const last = dateStr(new Date(ym.y, ym.m + 1, 0));
  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('financial_transactions').select('*').gte('tx_date', first + 'T00:00:00+07:00').lte('tx_date', last + 'T23:59:59+07:00').order('tx_date', { ascending: false }),
      supabase.from('bookings').select('id').gte('start_date', first).lte('start_date', last),
      supabase.from('v_booking_finance').select('*')]);
    if (a.error) setErr(a.error.message);
    const ids = new Set((b.data || []).map((x) => x.id));
    setTx(a.data || []); setRows((c.data || []).filter((r) => ids.has(r.id)));
  }, [first, last]);
  useEffect(() => { load(); }, [load]);
  const sum = (arr, k) => arr.reduce((s, r) => s + Number(r[k] || 0), 0);
  const inn = sum(tx.filter((t) => t.direction === 'in'), 'amount'); const outt = sum(tx.filter((t) => t.direction === 'out'), 'amount');
  const shift = (d) => setYm(({ y, m }) => { const x = new Date(y, m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  async function addExpense(e) {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('expenses').insert({ category: ef.category, description: ef.description || null, amount: Number(ef.amount), expense_date: ef.expense_date });
    if (error) { setErr(error.message); return; } setEf({ ...ef, description: '', amount: '' }); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h1 className="h1">Keuangan</h1>
        <div className="flex items-center gap-2"><button className="btn btn-ghost btn-sm" onClick={() => shift(-1)} aria-label="Bulan sebelumnya">‹</button><span className="text-sm font-semibold capitalize">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Bulan berikutnya">›</button></div></div>
      <Err>{err}</Err>
      <section className="card"><div className="font-bold mb-2">Arus kas (uang nyata masuk / keluar)</div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm"><div><div className="muted">Masuk</div><b>{rp(inn)}</b></div><div><div className="muted">Keluar</div><b>{rp(outt)}</b></div><div><div className="muted">Selisih</div><b>{rp(inn - outt)}</b></div></div></section>
      <section className="card"><div className="font-bold mb-2">Laba booking (berdasarkan tanggal layanan)</div>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">{[['Omzet', 'revenue'], ['Biaya modal', 'actual_cost'], ['Laba', 'profit'], ['Piutang', 'outstanding']].map(([t, k]) => (<div key={k}><div className="muted">{t}</div><b>{rp(sum(rows, k))}</b></div>))}</div>
        <p className="muted mt-2">Omzet = nilai booking yang tidak dibatalkan + DP hangus. DP tidak dihitung dua kali saat pelunasan.</p></section>
      <form onSubmit={addExpense} className="card grid gap-2 md:grid-cols-5"><div className="font-bold md:col-span-5">Catat pengeluaran umum</div>
        <select className="inp" aria-label="Kategori" value={ef.category} onChange={(e) => setEf({ ...ef, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="inp" placeholder="Keterangan" aria-label="Keterangan" value={ef.description} onChange={(e) => setEf({ ...ef, description: e.target.value })} />
        <input className="inp" type="number" placeholder="Nominal" aria-label="Nominal" required value={ef.amount} onChange={(e) => setEf({ ...ef, amount: e.target.value })} />
        <input className="inp" type="date" aria-label="Tanggal" value={ef.expense_date} onChange={(e) => setEf({ ...ef, expense_date: e.target.value })} /><button className="btn">Simpan</button></form>
      <section className="card"><div className="font-bold mb-2">Buku besar</div>
        {tx.length === 0 ? <div className="muted">Belum ada transaksi bulan ini.</div> : tx.map((t) => (
          <div key={t.id} className="flex items-center justify-between border-t border-line py-2 text-sm first:border-0"><div>{t.category}<div className="muted">{tgl(t.tx_date)} · {t.description || ''}</div></div>
            <b className={t.direction === 'in' ? 'text-green-800' : 'text-ember'}>{t.direction === 'in' ? '+' : '−'} {rp(t.amount)}</b></div>))}
        <p className="muted mt-2">Catatan keuangan tidak dapat dihapus. Koreksi dilakukan dengan transaksi pembalik.</p></section>
    </div>
  );
}
