'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rp, tgl } from '@/lib/format';
import { Chip, Err } from '@/components/ui';
const ST = ['Semua', 'Pending', 'Waiting Payment', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

export default function Bookings() {
  const [rows, setRows] = useState([]); const [fin, setFin] = useState({}); const [q, setQ] = useState('');
  const [st, setSt] = useState('Semua'); const [by, setBy] = useState('Semua'); const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from('bookings').select('*, customers(name), vehicles(plate_no,type_name), tour_packages(name), creator:profiles!bookings_created_by_fkey(username)').order('start_date', { ascending: false }),
        supabase.from('v_booking_finance').select('id,outstanding,profit,paid')]);
      if (a.error) setErr(a.error.message);
      setRows(a.data || []); setFin(Object.fromEntries((b.data || []).map((r) => [r.id, r])));
    })();
  }, []);
  const users = [...new Set(rows.map((r) => r.creator?.username).filter(Boolean))];
  const name = (b) => b.tour_packages?.name || (b.booking_type === 'rental' ? 'Rental mobil' : 'Custom tour');
  const shown = rows.filter((r) => (st === 'Semua' || r.status === st) && (by === 'Semua' || r.creator?.username === by) &&
    (!q || `${r.booking_no} ${r.customers?.name} ${r.vehicles?.plate_no}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h1 className="h1">Booking</h1><Link href="/bookings/new" className="btn btn-ember btn-sm">+ Booking baru</Link></div>
      <Err>{err}</Err>
      <input className="inp" placeholder="Cari nomor, nama, plat…" aria-label="Cari" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-2">
        <select className="inp" aria-label="Status" value={st} onChange={(e) => setSt(e.target.value)}>{ST.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="inp" aria-label="Diinput oleh" value={by} onChange={(e) => setBy(e.target.value)}><option>Semua</option>{users.map((u) => <option key={u}>{u}</option>)}</select>
      </div>
      {shown.length === 0 ? <div className="card muted">Belum ada booking.</div> : shown.map((b) => (
        <Link key={b.id} href={`/bookings/${b.id}`} className="card block">
          <div className="flex items-center justify-between"><span className="font-bold">{b.booking_no}</span><Chip s={b.status} /></div>
          <div className="text-sm">{b.customers?.name} · {name(b)}</div>
          <div className="muted">{tgl(b.start_date)}{b.end_date !== b.start_date ? ' – ' + tgl(b.end_date) : ''} · {b.vehicles ? `${b.vehicles.type_name} ${b.vehicles.plate_no}` : 'tanpa unit'} · oleh {b.creator?.username || '-'}</div>
          <div className="mt-1 flex justify-between text-sm"><span className="muted">Sisa tagihan</span><span className="font-semibold">{rp(fin[b.id]?.outstanding)}</span></div>
        </Link>))}
    </div>
  );
}
