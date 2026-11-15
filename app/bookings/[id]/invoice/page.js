'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rp, tgl, waLink } from '@/lib/format';
import Logo from '@/components/Logo';
import { Err } from '@/components/ui';

export default function Invoice() {
  const { id } = useParams();
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      const [b, p, s] = await Promise.all([
        supabase.from('bookings').select('*, customers(name,whatsapp), vehicles(type_name,plate_no), tour_packages(name)').eq('id', id).single(),
        supabase.from('payments').select('*').eq('booking_id', id).eq('status', 'Verified').order('paid_at'),
        supabase.from('company_settings').select('*').eq('id', 1).single()]);
      if (b.error) { setErr(b.error.message); return; }
      let { data: inv } = await supabase.from('invoices').select('*').eq('booking_id', id).order('issued_at').limit(1).maybeSingle();
      if (!inv) { const r = await supabase.from('invoices').insert({ booking_id: id }).select().single(); if (r.error) { setErr(r.error.message); return; } inv = r.data; }
      setD({ b: b.data, pays: p.data || [], st: s.data, inv });
    })();
  }, [id]);
  if (!d) return <div>{err ? <Err>{err}</Err> : <div className="muted">Memuat…</div>}</div>;
  const { b, pays, st, inv } = d;
  const paid = pays.reduce((s, x) => s + Number(x.amount), 0); const sisa = Number(b.total_amount) - paid;
  const item = (b.tour_packages?.name || (b.booking_type === 'rental' ? 'Rental mobil' : 'Custom tour')) + (b.vehicles ? ` · ${b.vehicles.type_name} ${b.vehicles.plate_no}` : '') + (b.service_type ? (b.service_type === 'with_driver' ? ' (dengan driver)' : ' (lepas kunci)') : '');
  const msg = `Halo ${b.customers?.name}, berikut invoice ${inv.invoice_no} untuk booking ${b.booking_no}. Total ${rp(b.total_amount)}, sudah diterima ${rp(paid)}, sisa ${rp(sisa)}. Transfer ke ${st.bank_name} ${st.bank_account_no} a.n. ${st.bank_account_name}. Terima kasih.`;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 print:hidden"><Link href={`/bookings/${id}`} className="btn btn-ghost btn-sm">← Kembali</Link>
        <button className="btn btn-sm" onClick={() => window.print()}>Cetak / Simpan PDF</button>
        <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={waLink(b.customers?.whatsapp, msg)}>Kirim lewat WhatsApp</a></div>
      <div className="card mx-auto max-w-2xl space-y-4 !p-6 print:border-0">
        <div className="flex items-start justify-between"><Logo size={48} />
          <div className="text-right"><div className="text-xl font-bold text-sea">INVOICE</div><div className="muted">{inv.invoice_no}<br />Booking {b.booking_no}<br />{tgl(inv.issued_at)}</div></div></div>
        <div className="border-t-2 border-sea" />
        <div className="flex justify-between text-sm"><div><div className="muted">Kepada</div><div className="font-bold">{b.customers?.name}</div><div className="muted">{b.customers?.whatsapp}</div></div>
          <div className="text-right"><div className="muted">Tanggal layanan</div><div className="font-bold">{tgl(b.start_date)}{b.end_date !== b.start_date ? ' – ' + tgl(b.end_date) : ''}</div></div></div>
        <table className="w-full text-sm"><thead><tr className="bg-cream text-left"><th className="p-2">Layanan</th><th className="p-2 text-right">Jumlah</th></tr></thead><tbody>
          <tr><td className="p-2">{item}</td><td className="p-2 text-right">{rp(b.price)}</td></tr>
          {Number(b.discount) > 0 && <tr><td className="p-2">Diskon</td><td className="p-2 text-right">- {rp(b.discount)}</td></tr>}
          {Number(b.extra_fee) > 0 && <tr><td className="p-2">Biaya tambahan</td><td className="p-2 text-right">{rp(b.extra_fee)}</td></tr>}</tbody></table>
        <div className="ml-auto w-64 space-y-1 text-sm"><div className="flex justify-between"><span>Total tagihan</span><b>{rp(b.total_amount)}</b></div>
          {pays.map((p) => <div key={p.id} className="flex justify-between"><span>{p.payment_type} ({tgl(p.paid_at)})</span><span>{rp(p.amount)}</span></div>)}
          <div className="flex justify-between border-t border-line pt-1"><b>Sisa pembayaran</b><b className="text-ember">{rp(sisa)}</b></div></div>
        <div className="rounded-xl bg-cream p-3 text-sm"><div className="muted">Transfer ke</div><div className="font-bold">{st.bank_name} {st.bank_account_no}</div><div>a.n. {st.bank_account_name}</div>
          <div className="muted mt-1">Pelunasan dilakukan saat keberangkatan.</div></div>
        <div className="muted text-center">{st.company_name} · Terima kasih</div>
      </div>
    </div>
  );
}
