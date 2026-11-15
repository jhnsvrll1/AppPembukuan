'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rp, tgl, todayISO, dateStr } from '@/lib/format';
import { Chip, Err } from '@/components/ui';

function range(p) {
  const d = new Date(todayISO() + 'T00:00:00');
  let a = new Date(d), b = new Date(d);
  if (p === 'week') { a.setDate(d.getDate() - ((d.getDay() + 6) % 7)); b = new Date(a); b.setDate(a.getDate() + 6); }
  if (p === 'month') { a = new Date(d.getFullYear(), d.getMonth(), 1); b = new Date(d.getFullYear(), d.getMonth() + 1, 0); }
  if (p === 'year') { a = new Date(d.getFullYear(), 0, 1); b = new Date(d.getFullYear(), 11, 31); }
  return [dateStr(a), dateStr(b)];
}
const PERIODS = [['day', 'Hari ini'], ['week', 'Minggu'], ['month', 'Bulan'], ['year', 'Tahun'], ['custom', 'Custom']];

export default function Dashboard() {
  const [p, setP] = useState('month');
  const [cu, setCu] = useState([todayISO(), todayISO()]);
  const [bk, setBk] = useState([]);
  const [fin, setFin] = useState({});
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from('bookings').select('id,booking_no,status,start_date,end_date,booking_type,customers(name),vehicles(plate_no),tour_packages(name)'),
        supabase.from('v_booking_finance').select('*')]);
      if (a.error || b.error) setErr((a.error || b.error).message);
      setBk(a.data || []); setFin(Object.fromEntries((b.data || []).map((r) => [r.id, r])));
    })();
  }, []);
  const [from, to] = p === 'custom' ? cu : range(p);
  const inR = bk.filter((b) => b.start_date >= from && b.start_date <= to);
  const sum = (k) => inR.reduce((s, b) => s + Number(fin[b.id]?.[k] || 0), 0);
  const cnt = (...st) => inR.filter((b) => st.includes(b.status)).length;
  const today = todayISO();
  const soon = dateStr(new Date(new Date(today + 'T00:00:00').getTime() + 2 * 864e5));
  const runToday = bk.filter((b) => b.status !== 'Cancelled' && b.start_date <= today && b.end_date >= today);
  const needPay = bk.filter((b) => ['Confirmed', 'Waiting Payment', 'Pending'].includes(b.status) && b.start_date >= today && b.start_date <= soon && Number(fin[b.id]?.outstanding || 0) > 0);
  const K = [['Omzet', sum('revenue')], ['Uang diterima', sum('paid')], ['Piutang pelanggan', sum('outstanding')], ['Estimasi laba', sum('profit')]];
  const name = (b) => b.tour_packages?.name || (b.booking_type === 'rental' ? 'Rental mobil' : 'Custom tour');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="h1">Beranda</h1><Link href="/bookings/new" className="btn btn-ember btn-sm">+ Booking baru</Link></div>
      <Err>{err}</Err>
      <div className="flex flex-wrap gap-2">{PERIODS.map(([k, t]) => (
        <button key={k} onClick={() => setP(k)} className={`chip ${p === k ? 'bg-sea text-white' : 'bg-stone-200 text-stone-800'}`}>{t}</button>))}</div>
      {p === 'custom' && <div className="flex gap-2"><input type="date" aria-label="Dari" className="inp" value={cu[0]} onChange={(e) => setCu([e.target.value, cu[1]])} />
        <input type="date" aria-label="Sampai" className="inp" value={cu[1]} onChange={(e) => setCu([cu[0], e.target.value])} /></div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{K.map(([t, v]) => (<div key={t} className="card"><div className="muted">{t}</div><div className="text-lg font-bold">{rp(v)}</div></div>))}</div>
      <div className="grid grid-cols-4 gap-2 text-center">{[['Baru', cnt('Pending', 'Waiting Payment')], ['Aktif', cnt('Confirmed', 'In Progress')], ['Selesai', cnt('Completed')], ['Batal', cnt('Cancelled')]].map(([t, v]) => (
        <div key={t} className="card !p-3"><div className="text-xl font-bold">{v}</div><div className="muted">{t}</div></div>))}</div>
      <section className="card"><h2 className="font-bold mb-2">Tour & rental hari ini ({runToday.length})</h2>
        {runToday.length === 0 ? <div className="muted">Tidak ada jadwal hari ini.</div> : runToday.map((b) => (
          <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between border-t border-line py-2 text-sm first:border-0">
            <span>{b.customers?.name} · {name(b)} {b.vehicles?.plate_no && <span className="muted">· {b.vehicles.plate_no}</span>}</span><Chip s={b.status} /></Link>))}</section>
      <section className="card"><h2 className="font-bold mb-2">Perlu tindakan: berangkat ≤ 2 hari, belum lunas ({needPay.length})</h2>
        {needPay.length === 0 ? <div className="muted">Tidak ada.</div> : needPay.map((b) => (
          <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between border-t border-line py-2 text-sm first:border-0">
            <span>{b.booking_no} · {b.customers?.name} · {tgl(b.start_date)}</span><span className="font-semibold text-ember">{rp(fin[b.id]?.outstanding)}</span></Link>))}</section>
    </div>
  );
}
