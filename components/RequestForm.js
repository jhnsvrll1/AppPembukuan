'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/format';
import { Err } from './ui';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const refCode = () => 'REQ-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CHARS[b % CHARS.length]).join('');
const EMPTY = { request_type: 'package', package_id: '', vehicle_type: '', service_type: 'with_driver', start_date: todayISO(), end_date: todayISO(), pax: '', pickup_location: '', destination: '', name: '', whatsapp: '', email: '', country: '', message: '', website: '' };

export default function RequestForm({ packages = [], vehicles = [], waNumber = '', waFallback = '' }) {
  const [f, setF] = useState(EMPTY); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  useEffect(() => {
    const q = new URLSearchParams(window.location.search); const pk = q.get('paket'); const mb = q.get('mobil'); const ct = q.get('custom');
    if (pk && packages.some((p) => p.id === pk)) setF((o) => ({ ...o, request_type: 'package', package_id: pk }));
    else if (mb && vehicles.some((v) => v.type_name === mb)) setF((o) => ({ ...o, request_type: 'rental', vehicle_type: mb }));
    else if (ct) setF((o) => ({ ...o, request_type: 'custom' }));
  }, []);
  const waUrl = (ref) => (waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo JavaBali Travelmate, saya baru mengirim permintaan booking dengan kode ${ref}.`)}` : waFallback);

  async function submit(e) {
    e.preventDefault(); setErr('');
    if (f.website) { setDone({ ref: refCode() }); return; }
    if (f.end_date < f.start_date) return setErr('Tanggal selesai tidak boleh sebelum tanggal mulai.');
    if (f.request_type === 'package' && !f.package_id) return setErr('Pilih paket tour terlebih dahulu.');
    if (f.request_type === 'rental' && !f.vehicle_type) return setErr('Pilih tipe mobil terlebih dahulu.');
    setBusy(true); const ref = refCode();
    const { error } = await supabase.from('booking_requests').insert({
      ref_code: ref, name: f.name.trim(), whatsapp: f.whatsapp.trim(), email: f.email.trim() || null, country: f.country.trim() || null, request_type: f.request_type,
      package_id: f.request_type === 'package' ? f.package_id : null, vehicle_type: f.request_type === 'rental' ? f.vehicle_type : null, service_type: f.request_type === 'rental' ? f.service_type : null,
      start_date: f.start_date, end_date: f.end_date, pax: f.pax ? Number(f.pax) : null, pickup_location: f.pickup_location.trim() || null, destination: f.destination.trim() || null, message: f.message.trim() || null });
    setBusy(false);
    if (error) return setErr(error.message.includes('Terlalu banyak') ? error.message : 'Permintaan belum terkirim. Periksa isian Anda atau hubungi kami lewat WhatsApp.');
    setDone({ ref }); setF(EMPTY);
  }
  const inp = (k, l, t = 'text', x = {}) => (<div><label htmlFor={'p_' + k} className="lbl">{l}</label><input id={'p_' + k} type={t} className="inp" value={f[k]} onChange={(e) => set(k, e.target.value)} {...x} /></div>);
  const seg = (k, opts) => (<div className="flex flex-wrap gap-2">{opts.map(([v, l]) => (<button type="button" key={v} onClick={() => set(k, v)} aria-pressed={f[k] === v} className={`chip !px-3 !py-2 ${f[k] === v ? 'bg-sea text-white' : 'bg-stone-200 text-stone-800'}`}>{l}</button>))}</div>);

  if (done) return (
    <div className="card space-y-3 text-center"><div className="text-lg font-bold">Permintaan terkirim</div>
      <p>Kode permintaan Anda: <b className="text-sea">{done.ref}</b></p>
      <p className="text-sm text-muted">Tim kami akan menghubungi Anda lewat WhatsApp. Untuk respons lebih cepat, chat kami dan sebutkan kode di atas.</p>
      <a className="btn" href={waUrl(done.ref)} target="_blank" rel="noreferrer">Chat kami di WhatsApp</a><button className="btn btn-ghost" onClick={() => setDone(null)}>Kirim permintaan lain</button></div>);
  return (
    <form onSubmit={submit} className="card space-y-3">
      {seg('request_type', [['package', 'Paket tour'], ['custom', 'Custom tour'], ['rental', 'Rental mobil']])}
      {f.request_type === 'package' && (<div><label htmlFor="p_pkg" className="lbl">Paket</label><select id="p_pkg" className="inp" value={f.package_id} onChange={(e) => set('package_id', e.target.value)}>
        <option value="">— pilih paket —</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>)}
      {f.request_type === 'rental' && (<><div><label htmlFor="p_veh" className="lbl">Tipe mobil</label><select id="p_veh" className="inp" value={f.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)}>
        <option value="">— pilih mobil —</option>{vehicles.map((v) => <option key={v.type_name}>{v.type_name}</option>)}</select></div>{seg('service_type', [['with_driver', 'Dengan driver'], ['self_drive', 'Lepas kunci']])}</>)}
      <div className="grid grid-cols-2 gap-3">{inp('start_date', 'Tanggal mulai', 'date', { min: todayISO(), required: true })}{inp('end_date', 'Tanggal selesai', 'date', { min: f.start_date, required: true })}</div>
      <div className="grid gap-3 md:grid-cols-2">{inp('pax', 'Jumlah orang', 'number', { min: 1, max: 100 })}{inp('pickup_location', 'Lokasi jemput', 'text', { maxLength: 200 })}</div>
      {f.request_type === 'custom' && inp('destination', 'Tujuan / destinasi yang diinginkan', 'text', { maxLength: 200 })}
      <div className="grid gap-3 md:grid-cols-2">{inp('name', 'Nama', 'text', { required: true, minLength: 2, maxLength: 100 })}{inp('whatsapp', 'Nomor WhatsApp', 'tel', { required: true, minLength: 6, maxLength: 25, placeholder: '08xx atau +62xx' })}
        {inp('email', 'Email (opsional)', 'email', { maxLength: 150 })}{inp('country', 'Negara asal (opsional)', 'text', { maxLength: 80 })}</div>
      <div><label htmlFor="p_msg" className="lbl">Pesan / permintaan khusus</label><textarea id="p_msg" rows={3} maxLength={1000} className="inp" value={f.message} onChange={(e) => set('message', e.target.value)} /></div>
      <div aria-hidden="true" className="hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label></div>
      <Err>{err}</Err><button className="btn btn-ember w-full" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim permintaan'}</button>
      <p className="muted text-center">Ini permintaan, bukan booking pasti. Booking dikonfirmasi setelah kami cek ketersediaan dan DP diterima.</p>
    </form>
  );
}
