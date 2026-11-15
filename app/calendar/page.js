'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { dateStr } from '@/lib/format';
import { Err } from '@/components/ui';

export default function Cal() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [vs, setVs] = useState([]); const [bk, setBk] = useState([]); const [err, setErr] = useState('');
  const first = dateStr(new Date(ym.y, ym.m, 1)); const nd = new Date(ym.y, ym.m + 1, 0).getDate(); const last = dateStr(new Date(ym.y, ym.m, nd));
  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from('vehicles').select('id,type_name,plate_no,status').order('type_name'),
        supabase.from('bookings').select('id,vehicle_id,start_date,end_date,status,booking_type,booking_no,customers(name)').neq('status', 'Cancelled').not('vehicle_id', 'is', null).lte('start_date', last).gte('end_date', first)]);
      if (a.error || b.error) setErr((a.error || b.error).message);
      setVs(a.data || []); setBk(b.data || []);
    })();
  }, [first, last]);
  const shift = (d) => setYm(({ y, m }) => { const x = new Date(y, m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h1 className="h1">Kalender mobil</h1>
        <div className="flex items-center gap-2"><button className="btn btn-ghost btn-sm" onClick={() => shift(-1)} aria-label="Bulan sebelumnya">‹</button>
          <span className="text-sm font-semibold capitalize">{title}</span><button className="btn btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Bulan berikutnya">›</button></div></div>
      <Err>{err}</Err>
      <div className="flex gap-2"><span className="chip bg-sea text-white">Tour</span><span className="chip bg-ember text-white">Rental</span><span className="chip bg-amber-100 text-amber-900">Maintenance</span></div>
      {vs.length === 0 ? <div className="card muted">Belum ada mobil. Tambahkan di menu Mobil.</div> : (
        <div className="card overflow-x-auto !p-0"><table className="min-w-full border-collapse text-xs">
          <thead><tr><th className="sticky left-0 z-10 bg-white p-2 text-left">Unit</th>{Array.from({ length: nd }, (_, i) => <th key={i} className="min-w-[28px] p-1 font-semibold">{i + 1}</th>)}</tr></thead>
          <tbody>{vs.map((v) => (<tr key={v.id} className="border-t border-line"><td className="sticky left-0 z-10 whitespace-nowrap bg-white p-2 font-semibold">{v.type_name}<div className="muted">{v.plate_no}</div></td>
            {Array.from({ length: nd }, (_, i) => { const ds = dateStr(new Date(ym.y, ym.m, i + 1)); const x = bk.find((k) => k.vehicle_id === v.id && k.start_date <= ds && k.end_date >= ds);
              return (<td key={i} className="p-0.5 text-center">{x ? <Link href={`/bookings/${x.id}`} title={`${x.booking_no} · ${x.customers?.name}`} aria-label={`${x.booking_no} ${x.customers?.name}`} className={`block h-7 rounded ${x.booking_type === 'rental' ? 'bg-ember' : 'bg-sea'}`} />
                : <div className={`h-7 rounded ${['Maintenance', 'Unavailable'].includes(v.status) ? 'bg-amber-100' : 'bg-cream'}`} />}</td>); })}</tr>))}</tbody></table></div>)}
      <p className="muted">Satu plat tidak bisa dipesan dua kali di tanggal yang sama. Tipe mobil sama boleh, asal platnya berbeda.</p>
    </div>
  );
}
