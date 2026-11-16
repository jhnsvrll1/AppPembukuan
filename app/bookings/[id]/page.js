'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rp, tgl, todayISO, waLink } from '@/lib/format';
import { Chip, Err, Field } from '@/components/ui';
import { useMe } from '@/components/Frame';

const NEXT = ['Pending', 'Waiting Payment', 'Confirmed', 'In Progress', 'Completed'];
const EDIT = [
  { name: 'pax', label: 'Jumlah peserta', type: 'number' }, { name: 'pickup_location', label: 'Lokasi jemput' }, { name: 'destination', label: 'Tujuan' },
  { name: 'itinerary', label: 'Itinerary', type: 'textarea' }, { name: 'discount', label: 'Diskon', type: 'number' }, { name: 'extra_fee', label: 'Biaya tambahan', type: 'number' },
  { name: 'notes', label: 'Catatan', type: 'textarea' }
];

export default function Detail() {
  const { id } = useParams();
  const me = useMe();
  const [b, setB] = useState(null); const [fin, setFin] = useState(null); const [pays, setPays] = useState([]); const [costs, setCosts] = useState([]);
  const [st, setSt] = useState(null); const [cats, setCats] = useState([]); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const [edit, setEdit] = useState(null);
  const [pf, setPf] = useState({ payment_type: 'DP', amount: '', method: 'transfer', verified: false, file: null });
  const [cf, setCf] = useState({ kind: 'actual', category: 'BBM', description: '', qty: 1, unit_price: '', is_paid: true });
  const [tpl, setTpl] = useState('konfirmasi');

  const load = useCallback(async () => {
    const [a, f, p, c, s, k] = await Promise.all([
      supabase.from('bookings').select('*, customers(name,whatsapp), vehicles(type_name,plate_no,supplier_id), tour_packages(name), creator:profiles!bookings_created_by_fkey(username,full_name), updater:profiles!bookings_updated_by_fkey(username)').eq('id', id).single(),
      supabase.from('v_booking_finance').select('*').eq('id', id).single(),
      supabase.from('payments').select('*').eq('booking_id', id).order('created_at'),
      supabase.from('booking_costs').select('*').eq('booking_id', id).order('created_at'),
      supabase.from('company_settings').select('*').eq('id', 1).single(),
      supabase.from('cost_categories').select('name').order('name')]);
    if (a.error) { setErr(a.error.message); return; }
    setB(a.data); setFin(f.data); setPays(p.data || []); setCosts(c.data || []); setSt(s.data); setCats((k.data || []).map((x) => x.name));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, msg) => { setErr(''); setOk(''); try { const r = await fn(); if (r?.error) throw r.error; if (msg) setOk(msg); await load(); } catch (e) { setErr(e.message); } };
  if (!b || !st) return <div>{err ? <Err>{err}</Err> : <div className="muted">Memuat…</div>}</div>;

  const num = (x) => Number(x || 0);
  const out = num(fin?.outstanding); const dpAmt = num(b.total_amount) * num(st.dp_percent) / 100;
  const product = b.tour_packages?.name || (b.booking_type === 'rental' ? 'Rental mobil' : 'Custom tour');
  const active = !['Cancelled', 'Completed'].includes(b.status); // masih bisa dibatalkan
  const editable = b.status !== 'Cancelled'; // pembayaran, status, dan detail tetap bisa diubah setelah Completed

  function refundPreview() {
    const d = Math.round((new Date(b.start_date) - new Date(todayISO())) / 864e5);
    const pct = d >= st.refund_full_days ? st.refund_full_percent : d >= st.refund_partial_days ? st.refund_partial_percent : 0;
    return { d, pct, amt: Math.round(num(fin?.paid) * pct) / 100 };
  }
  async function cancel() {
    const r = refundPreview();
    if (!window.confirm(`Batalkan ${b.booking_no}?\nH-${r.d}: refund ${r.pct}% dari uang diterima = ${rp(r.amt)}.\nTindakan ini tidak bisa dibatalkan.`)) return;
    const reason = window.prompt('Alasan pembatalan:') || '';
    run(() => supabase.rpc('cancel_booking', { p_booking_id: id, p_reason: reason }), 'Booking dibatalkan.');
  }
  async function setStatus(v) {
    if (v === 'Completed' && out > 0 && !window.confirm(`Masih ada sisa tagihan ${rp(out)}. Tetap tandai selesai?`)) return;
    run(() => supabase.from('bookings').update({ status: v }).eq('id', id));
  }
  async function addPayment(e) {
    e.preventDefault();
    run(async () => {
      let proof = null;
      if (pf.file) {
        const path = `${id}/${Date.now()}-${pf.file.name.replace(/[^\w.\-]/g, '_')}`;
        const up = await supabase.storage.from('payment-proofs').upload(path, pf.file);
        if (up.error) return up; proof = path;
      }
      const r = await supabase.from('payments').insert({ booking_id: id, payment_type: pf.payment_type, amount: Number(pf.amount), method: pf.method, status: pf.verified ? 'Verified' : 'Pending', proof_path: proof });
      if (!r.error) setPf({ payment_type: 'Pelunasan', amount: '', method: 'transfer', verified: false, file: null });
      return r;
    }, 'Pembayaran dicatat.');
  }
  async function viewProof(path) { const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 120); if (data) window.open(data.signedUrl, '_blank'); }
  async function addCost(e) {
    e.preventDefault();
    run(async () => {
      const r = await supabase.from('booking_costs').insert({ booking_id: id, kind: cf.kind, category: cf.category, description: cf.description || null, qty: Number(cf.qty || 1),
        unit_price: Number(cf.unit_price), is_paid: cf.kind === 'actual' && cf.is_paid, paid_by: cf.kind === 'actual' && cf.is_paid ? me.id : null, supplier_id: cf.category === 'Sewa unit partner' ? b.vehicles?.supplier_id || null : null });
      if (!r.error) setCf({ ...cf, description: '', unit_price: '' });
      return r;
    }, 'Biaya dicatat.');
  }
  const wa = {
    konfirmasi: `Halo ${b.customers?.name}, booking ${b.booking_no} (${product}) tanggal ${tgl(b.start_date)} sudah kami konfirmasi. Terima kasih telah memilih JavaBali Travelmate.`,
    dp: `Halo ${b.customers?.name}, untuk mengonfirmasi booking ${b.booking_no} (${product}, ${tgl(b.start_date)}), mohon transfer DP ${rp(dpAmt)} ke ${st.bank_name} ${st.bank_account_no} a.n. ${st.bank_account_name}. Mohon kirim bukti transfer ke chat ini. Terima kasih.`,
    lunas: `Halo ${b.customers?.name}, pengingat: sisa pembayaran booking ${b.booking_no} sebesar ${rp(out)} dilunasi saat keberangkatan pada ${tgl(b.start_date)}. Terima kasih.`,
    jadwal: `Halo ${b.customers?.name}, pengingat jadwal ${product} pada ${tgl(b.start_date)}. Jemput di: ${b.pickup_location || '[lokasi]'}. Sampai jumpa!`,
    terima: `Halo ${b.customers?.name}, terima kasih telah menggunakan JavaBali Travelmate. Semoga perjalanannya menyenangkan. Kami tunggu perjalanan berikutnya!`
  };
  const planned = costs.filter((c) => c.kind === 'planned'); const actual = costs.filter((c) => c.kind === 'actual');

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2"><div><h1 className="h1">{b.booking_no}</h1>
        <div className="muted">Diinput oleh: <b>{b.creator?.username || '-'}</b> · {tgl(b.created_at)}{b.updater && <> · diubah oleh {b.updater.username}</>}</div></div><Chip s={b.status} /></div>
      <Err>{err}</Err>{ok && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-900">{ok}</div>}

      <section className="card text-sm space-y-1">
        <div className="font-bold">{b.customers?.name}</div><div>{product} · {tgl(b.start_date)}{b.end_date !== b.start_date ? ' – ' + tgl(b.end_date) : ''} · {b.pax || '-'} orang</div>
        <div>Unit: {b.vehicles ? `${b.vehicles.type_name} ${b.vehicles.plate_no} (${b.service_type === 'with_driver' ? 'dengan driver' : 'lepas kunci'})` : '-'}</div>
        {b.pickup_location && <div>Jemput: {b.pickup_location}</div>}{b.destination && <div>Tujuan: {b.destination}</div>}
        {b.itinerary && <div className="whitespace-pre-line muted">{b.itinerary}</div>}{b.notes && <div className="muted">Catatan: {b.notes}</div>}
        {b.status === 'Cancelled' && <div className="text-ember">Dibatalkan: {b.cancel_reason || '-'}</div>}
        {editable && !edit && <button className="btn btn-ghost btn-sm mt-2" onClick={() => setEdit({ ...b })}>Ubah detail</button>}
      </section>
      {edit && (<form className="card space-y-3" onSubmit={(e) => { e.preventDefault(); const p = {}; EDIT.forEach((f) => { const v = edit[f.name]; p[f.name] = f.type === 'number' ? (v === '' || v == null ? (f.name === 'pax' ? null : 0) : Number(v)) : v === '' ? null : v; });
        run(() => supabase.from('bookings').update(p).eq('id', id), 'Tersimpan.').then(() => setEdit(null)); }}>
        <div className="grid gap-3 md:grid-cols-2">{EDIT.map((f) => <Field key={f.name} f={f} value={edit[f.name]} onChange={(k, v) => setEdit({ ...edit, [k]: v })} />)}</div>
        <div className="flex gap-2"><button className="btn">Simpan</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Batal</button></div></form>)}

      <section className="card space-y-2 text-sm"><div className="font-bold">Ringkasan keuangan</div>
        {[['Total tagihan', b.total_amount], ['Sudah diterima', fin?.paid], ['Sisa tagihan', fin?.outstanding], ['Refund', fin?.refunded], ['Modal (rencana)', fin?.planned_cost], ['Modal (aktual)', fin?.actual_cost]].map(([t, v]) => (
          <div key={t} className="flex justify-between"><span className="text-muted">{t}</span><b>{rp(v)}</b></div>))}
        <div className="flex justify-between border-t border-line pt-2"><span className="font-bold">Laba</span><b className={num(fin?.profit) < 0 ? 'text-ember' : 'text-green-800'}>{rp(fin?.profit)}</b></div></section>

      {editable && (<section className="card space-y-2"><label htmlFor="stt" className="lbl">Ubah status</label>
        <select id="stt" className="inp" value={b.status} onChange={(e) => setStatus(e.target.value)}>{NEXT.map((s) => <option key={s}>{s}</option>)}</select></section>)}

      <section className="card space-y-3"><div className="font-bold">Pembayaran</div>
        {pays.length === 0 && <div className="muted">Belum ada pembayaran. DP {st.dp_percent}% = {rp(dpAmt)}.</div>}
        {pays.map((p) => (<div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-sm first:border-0 first:pt-0">
          <div><b>{p.payment_type}</b> {rp(p.amount)} <span className="muted">· {p.method} · {tgl(p.paid_at)}</span></div>
          <div className="flex items-center gap-2"><Chip s={p.status} />
            {p.proof_path && <button className="btn btn-ghost btn-sm" onClick={() => viewProof(p.proof_path)}>Bukti</button>}
            {p.status === 'Pending' && <><button className="btn btn-sm" onClick={() => run(() => supabase.from('payments').update({ status: 'Verified' }).eq('id', p.id), 'Terverifikasi.')}>Verifikasi</button>
              <button className="btn btn-ghost btn-sm" onClick={() => run(() => supabase.from('payments').update({ status: 'Rejected' }).eq('id', p.id))}>Tolak</button></>}</div></div>))}
        {editable && (<form onSubmit={addPayment} className="grid gap-2 border-t border-line pt-3 md:grid-cols-4">
          <select className="inp" aria-label="Jenis" value={pf.payment_type} onChange={(e) => setPf({ ...pf, payment_type: e.target.value })}><option>DP</option><option>Pelunasan</option><option>Cicilan</option></select>
          <input className="inp" type="number" placeholder={`Nominal (saran ${pays.length ? out : dpAmt})`} aria-label="Nominal" required value={pf.amount} onChange={(e) => setPf({ ...pf, amount: e.target.value })} />
          <select className="inp" aria-label="Metode" value={pf.method} onChange={(e) => setPf({ ...pf, method: e.target.value })}><option value="transfer">Transfer</option><option value="cash">Cash</option><option value="qris">QRIS</option></select>
          <input className="inp" type="file" accept="image/*,application/pdf" aria-label="Bukti transfer" onChange={(e) => setPf({ ...pf, file: e.target.files[0] })} />
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={pf.verified} onChange={(e) => setPf({ ...pf, verified: e.target.checked })} />Langsung terverifikasi</label>
          <button className="btn md:col-span-2">Catat pembayaran</button></form>)}</section>

      <section className="card space-y-3"><div className="font-bold">Biaya modal</div>
        {[['Rencana', planned], ['Aktual', actual]].map(([t, list]) => (<div key={t}><div className="muted mb-1">{t}</div>
          {list.length === 0 ? <div className="muted">—</div> : list.map((c) => (<div key={c.id} className="flex items-center justify-between gap-2 border-t border-line py-1 text-sm first:border-0">
            <span>{c.category}{c.description ? ' · ' + c.description : ''} <span className="muted">×{c.qty}</span></span>
            <span className="flex items-center gap-2"><b>{rp(c.total)}</b>{c.kind === 'actual' && (c.is_paid ? <Chip s="Dibayar" cls="bg-green-100 text-green-900" /> :
              <button className="btn btn-ghost btn-sm" onClick={() => run(() => supabase.from('booking_costs').update({ is_paid: true, paid_by: me.id }).eq('id', c.id), 'Ditandai dibayar.')}>Tandai dibayar</button>)}</span></div>))}</div>))}
        <form onSubmit={addCost} className="grid gap-2 border-t border-line pt-3 md:grid-cols-6">
          <select className="inp" aria-label="Jenis biaya" value={cf.kind} onChange={(e) => setCf({ ...cf, kind: e.target.value })}><option value="actual">Aktual</option><option value="planned">Rencana</option></select>
          <select className="inp" aria-label="Kategori" value={cf.category} onChange={(e) => setCf({ ...cf, category: e.target.value })}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <input className="inp" placeholder="Keterangan" aria-label="Keterangan" value={cf.description} onChange={(e) => setCf({ ...cf, description: e.target.value })} />
          <input className="inp" type="number" placeholder="Jumlah" aria-label="Jumlah" value={cf.qty} onChange={(e) => setCf({ ...cf, qty: e.target.value })} />
          <input className="inp" type="number" placeholder="Harga satuan" aria-label="Harga satuan" required value={cf.unit_price} onChange={(e) => setCf({ ...cf, unit_price: e.target.value })} />
          <button className="btn">Tambah</button>
          {cf.kind === 'actual' && <label className="flex items-center gap-2 text-sm md:col-span-6"><input type="checkbox" checked={cf.is_paid} onChange={(e) => setCf({ ...cf, is_paid: e.target.checked })} />Sudah dibayar (masuk pengeluaran)</label>}</form></section>

      <section className="card space-y-2"><div className="font-bold">WhatsApp & invoice</div>
        <div className="flex gap-2"><select className="inp" aria-label="Template" value={tpl} onChange={(e) => setTpl(e.target.value)}>
          <option value="konfirmasi">Konfirmasi booking</option><option value="dp">Permintaan DP</option><option value="lunas">Pengingat pelunasan</option><option value="jadwal">Pengingat jadwal</option><option value="terima">Terima kasih</option></select>
          <a className="btn" target="_blank" rel="noreferrer" href={waLink(b.customers?.whatsapp, wa[tpl])}>Kirim</a></div>
        {!b.customers?.whatsapp && <div className="muted">Nomor WhatsApp pelanggan belum diisi.</div>}
        <Link href={`/bookings/${id}/invoice`} className="btn btn-ghost w-full">Buka invoice</Link></section>
      {active && <button className="btn btn-ghost w-full !text-ember !border-ember" onClick={cancel}>Batalkan booking</button>}
    </div>
  );
}
