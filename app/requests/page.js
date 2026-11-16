'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { tgl, waLink } from '@/lib/format';
import { Chip, Err } from '@/components/ui';
import { useMe } from '@/components/Frame';

const ST = ['New', 'Contacted', 'Converted', 'Rejected', 'Semua'];
const LABEL = { New: 'Baru', Contacted: 'Sudah dihubungi', Converted: 'Jadi booking', Rejected: 'Ditolak', Semua: 'Semua' };
const TYPE = { package: 'Paket tour', custom: 'Custom tour', rental: 'Rental mobil' };

export default function Requests() {
  const me = useMe();
  const [rows, setRows] = useState([]); const [st, setSt] = useState('New'); const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('booking_requests').select('*, tour_packages(name)').order('created_at', { ascending: false });
    if (error) setErr(error.message); setRows(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const mark = async (id, status) => {
    const { error } = await supabase.from('booking_requests').update({ status, handled_by: me.id, handled_at: new Date().toISOString() }).eq('id', id);
    if (error) setErr(error.message); else load();
  };
  const shown = rows.filter((r) => st === 'Semua' || r.status === st);
  return (
    <div className="space-y-3">
      <h1 className="h1">Permintaan masuk</h1><Err>{err}</Err>
      <div className="flex flex-wrap gap-2">{ST.map((s) => (
        <button key={s} onClick={() => setSt(s)} className={`chip !px-3 !py-1.5 ${st === s ? 'bg-sea text-white' : 'bg-stone-200 text-stone-800'}`}>
          {LABEL[s]}{s !== 'Semua' ? ` (${rows.filter((r) => r.status === s).length})` : ''}</button>))}</div>
      {shown.length === 0 ? <div className="card muted">Tidak ada permintaan.</div> : shown.map((r) => (
        <div key={r.id} className="card space-y-2 text-sm">
          <div className="flex items-center justify-between"><b>{r.ref_code}</b><Chip s={LABEL[r.status]} cls={r.status === 'New' ? 'bg-orange-100 text-orange-900' : r.status === 'Converted' ? 'bg-green-100 text-green-900' : 'bg-stone-200 text-stone-700'} /></div>
          <div><b>{r.name}</b> · {r.whatsapp}{r.country ? ' · ' + r.country : ''}</div>
          <div>{TYPE[r.request_type]}{r.tour_packages?.name ? ': ' + r.tour_packages.name : ''}{r.vehicle_type ? ': ' + r.vehicle_type : ''}{r.service_type ? (r.service_type === 'with_driver' ? ' (dengan driver)' : ' (lepas kunci)') : ''}</div>
          <div className="muted">{tgl(r.start_date)}{r.end_date !== r.start_date ? ' – ' + tgl(r.end_date) : ''} · {r.pax || '-'} orang{r.pickup_location ? ' · jemput: ' + r.pickup_location : ''}{r.destination ? ' · tujuan: ' + r.destination : ''}</div>
          {r.message && <div className="rounded-xl bg-cream p-2">{r.message}</div>}
          <div className="muted">Dikirim {new Date(r.created_at).toLocaleString('id-ID')}</div>
          {r.status !== 'Converted' && (<div className="flex flex-wrap gap-2">
            <a className="btn btn-sm" target="_blank" rel="noreferrer" onClick={() => r.status === 'New' && mark(r.id, 'Contacted')}
              href={waLink(r.whatsapp, `Halo ${r.name}, terima kasih telah mengirim permintaan ${r.ref_code} ke JavaBali Travelmate. Kami cek ketersediaan untuk tanggal ${tgl(r.start_date)} ya. `)}>Hubungi via WhatsApp</a>
            <Link className="btn btn-ember btn-sm" href={`/bookings/new?request=${r.id}`}>Jadikan booking</Link>
            {r.status !== 'Rejected' && <button className="btn btn-ghost btn-sm" onClick={() => window.confirm('Tolak permintaan ini?') && mark(r.id, 'Rejected')}>Tolak</button>}</div>)}
          {r.converted_booking_id && <Link className="text-sea underline" href={`/bookings/${r.converted_booking_id}`}>Lihat booking</Link>}
        </div>))}
    </div>
  );
}
