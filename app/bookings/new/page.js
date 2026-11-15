'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { rp, todayISO, days } from '@/lib/format';
import { Err } from '@/components/ui';

export default function NewBooking() {
  const router = useRouter();
  const [cs, setCs] = useState([]); const [vs, setVs] = useState([]); const [ps, setPs] = useState([]); const [cats, setCats] = useState([]);
  const [dpPct, setDpPct] = useState(50); const [busyV, setBusyV] = useState([]);
  const [f, setF] = useState({ customer_id: '', new_name: '', new_wa: '', booking_type: 'package', package_id: '', vehicle_id: '', service_type: 'with_driver',
    start_date: todayISO(), end_date: todayISO(), pax: '', pickup_location: '', destination: '', itinerary: '', price: '', discount: '', extra_fee: '', notes: '', rental_cost: '' });
  const [dirty, setDirty] = useState({ price: false, cost: false });
  const [extra, setExtra] = useState([]); const [err, setErr] = useState(''); const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    (async () => {
      const [a, b, c, d, e] = await Promise.all([
        supabase.from('customers').select('id,name,whatsapp').order('name'),
        supabase.from('vehicles').select('*').order('type_name'),
        supabase.from('tour_packages').select('*').eq('is_active', true).order('name'),
        supabase.from('cost_categories').select('name').order('name'),
        supabase.from('company_settings').select('dp_percent').eq('id', 1).single()]);
      setCs(a.data || []); setVs(b.data || []); setPs(c.data || []); setCats((d.data || []).map((x) => x.name)); if (e.data) setDpPct(Number(e.data.dp_percent));
    })();
  }, []);
  useEffect(() => {
    supabase.from('bookings').select('vehicle_id').neq('status', 'Cancelled').not('vehicle_id', 'is', null)
      .lte('start_date', f.end_date).gte('end_date', f.start_date).then(({ data }) => setBusyV((data || []).map((r) => r.vehicle_id)));
  }, [f.start_date, f.end_date]);

  const n = days(f.start_date, f.end_date);
  const veh = vs.find((v) => v.id === f.vehicle_id); const pkg = ps.find((p) => p.id === f.package_id);
  useEffect(() => {
    if (!dirty.price) {
      let p = null;
      if (f.booking_type === 'package' && pkg) p = pkg.price_per_car_day * n;
      if (f.booking_type === 'rental' && veh) p = (f.service_type === 'with_driver' ? veh.price_with_driver : veh.price_self_drive) * n;
      if (p !== null) setF((o) => ({ ...o, price: String(p) }));
    }
    if (!dirty.cost && veh) setF((o) => ({ ...o, rental_cost: String((f.service_type === 'with_driver' ? veh.cost_with_driver : veh.cost_self_drive) * n) }));
  }, [f.booking_type, f.package_id, f.vehicle_id, f.service_type, n, vs, ps]);

  const total = Number(f.price || 0) - Number(f.discount || 0) + Number(f.extra_fee || 0);
  const cost = Number(f.rental_cost || 0) + extra.reduce((s, x) => s + Number(x.qty || 1) * Number(x.unit_price || 0), 0);

  async function submit(e) {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      let cid = f.customer_id;
      if (cid === 'new') {
        if (!f.new_name) throw new Error('Nama pelanggan wajib diisi');
        const { data, error } = await supabase.from('customers').insert({ name: f.new_name, whatsapp: f.new_wa || null }).select('id').single();
        if (error) throw error; cid = data.id;
      }
      if (!cid) throw new Error('Pilih pelanggan');
      if (f.end_date < f.start_date) throw new Error('Tanggal selesai sebelum tanggal mulai');
      const row = { customer_id: cid, booking_type: f.booking_type, package_id: f.booking_type === 'package' ? f.package_id || null : null,
        vehicle_id: f.vehicle_id || null, service_type: f.vehicle_id ? f.service_type : null, start_date: f.start_date, end_date: f.end_date,
        pax: f.pax ? Number(f.pax) : null, pickup_location: f.pickup_location || null, destination: f.destination || null, itinerary: f.itinerary || null,
        price: Number(f.price || 0), discount: Number(f.discount || 0), extra_fee: Number(f.extra_fee || 0), notes: f.notes || null };
      const { data: b, error } = await supabase.from('bookings').insert(row).select('id').single();
      if (error) throw error;
      const costs = [];
      if (Number(f.rental_cost) > 0) costs.push({ category: 'Sewa unit partner', description: veh ? `${veh.type_name} ${veh.plate_no}` : null, qty: 1, unit_price: Number(f.rental_cost), supplier_id: veh?.supplier_id || null });
      extra.forEach((x) => { if (x.unit_price) costs.push({ category: x.category, description: x.description || null, qty: Number(x.qty || 1), unit_price: Number(x.unit_price) }); });
      if (costs.length) { const { error: e2 } = await supabase.from('booking_costs').insert(costs.map((c) => ({ ...c, booking_id: b.id, kind: 'planned' }))); if (e2) throw e2; }
      router.push('/bookings/' + b.id);
    } catch (ex) { setErr(ex.code === '23P01' ? 'Plat ini sudah dipesan di tanggal tersebut. Pilih unit lain.' : ex.message); }
    finally { setSaving(false); }
  }
  const T = (k, l, t = 'text', extra = {}) => (<div><label htmlFor={k} className="lbl">{l}</label><input id={k} type={t} className="inp" value={f[k]} onChange={(e) => set(k, e.target.value)} {...extra} /></div>);
  const seg = (k, opts) => (<div className="flex flex-wrap gap-2">{opts.map(([v, l]) => (<button type="button" key={v} onClick={() => set(k, v)} className={`chip !px-3 !py-2 ${f[k] === v ? 'bg-sea text-white' : 'bg-stone-200 text-stone-800'}`}>{l}</button>))}</div>);

  return (
    <form onSubmit={submit} className="space-y-3">
      <h1 className="h1">Booking baru</h1>
      <section className="card space-y-3"><div className="font-bold">Pelanggan</div>
        <select className="inp" aria-label="Pelanggan" value={f.customer_id} onChange={(e) => set('customer_id', e.target.value)}>
          <option value="">— pilih pelanggan —</option><option value="new">+ Pelanggan baru</option>{cs.map((c) => <option key={c.id} value={c.id}>{c.name}{c.whatsapp ? ' · ' + c.whatsapp : ''}</option>)}</select>
        {f.customer_id === 'new' && <div className="grid gap-3 md:grid-cols-2">{T('new_name', 'Nama pelanggan')}{T('new_wa', 'Nomor WhatsApp')}</div>}</section>
      <section className="card space-y-3"><div className="font-bold">Jenis & tanggal</div>
        {seg('booking_type', [['package', 'Paket tetap'], ['custom', 'Custom tour'], ['rental', 'Rental']])}
        {f.booking_type === 'package' && (<select className="inp" aria-label="Paket" value={f.package_id} onChange={(e) => set('package_id', e.target.value)}>
          <option value="">— pilih paket —</option>{ps.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
        <div className="grid grid-cols-2 gap-3">{T('start_date', 'Tanggal mulai', 'date')}{T('end_date', 'Tanggal selesai', 'date')}</div>
        <div className="muted">Durasi {n} hari</div></section>
      <section className="card space-y-3"><div className="font-bold">Unit mobil (per plat)</div>
        {seg('service_type', [['with_driver', 'Dengan driver'], ['self_drive', 'Lepas kunci']])}
        <select className="inp" aria-label="Unit" value={f.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
          <option value="">— belum pilih unit —</option>
          {vs.map((v) => { const off = busyV.includes(v.id) || ['Maintenance', 'Unavailable'].includes(v.status);
            return <option key={v.id} value={v.id} disabled={off}>{v.type_name} · {v.plate_no}{busyV.includes(v.id) ? ' (terpakai)' : v.status === 'Maintenance' || v.status === 'Unavailable' ? ` (${v.status})` : ''}</option>; })}</select>
        {vs.length === 0 && <div className="muted">Belum ada mobil. Tambahkan dulu di menu Mobil.</div>}</section>
      <section className="card space-y-3"><div className="font-bold">Detail perjalanan</div>
        <div className="grid gap-3 md:grid-cols-2">{T('pax', 'Jumlah peserta', 'number')}{T('pickup_location', 'Lokasi jemput')}{T('destination', 'Tujuan')}</div>
        <div><label htmlFor="it" className="lbl">Itinerary</label><textarea id="it" rows={3} className="inp" value={f.itinerary} onChange={(e) => set('itinerary', e.target.value)} /></div>
        <div><label htmlFor="nt" className="lbl">Catatan</label><textarea id="nt" rows={2} className="inp" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div></section>
      <section className="card space-y-3"><div className="font-bold">Harga</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="pr" className="lbl">Harga jual</label><input id="pr" type="number" className="inp" value={f.price} onChange={(e) => { setDirty((d) => ({ ...d, price: true })); set('price', e.target.value); }} /></div>
          {T('discount', 'Diskon', 'number')}{T('extra_fee', 'Biaya tambahan', 'number')}</div></section>
      <section className="card space-y-3"><div className="font-bold">Biaya modal (rencana)</div>
        <div><label htmlFor="rc" className="lbl">Sewa unit partner</label><input id="rc" type="number" className="inp" value={f.rental_cost} onChange={(e) => { setDirty((d) => ({ ...d, cost: true })); set('rental_cost', e.target.value); }} /></div>
        {extra.map((x, i) => (<div key={i} className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select className="inp md:col-span-1" aria-label="Kategori" value={x.category} onChange={(e) => setExtra(extra.map((y, j) => (j === i ? { ...y, category: e.target.value } : y)))}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <input className="inp" placeholder="Keterangan" aria-label="Keterangan" value={x.description} onChange={(e) => setExtra(extra.map((y, j) => (j === i ? { ...y, description: e.target.value } : y)))} />
          <input className="inp" type="number" placeholder="Jumlah" aria-label="Jumlah" value={x.qty} onChange={(e) => setExtra(extra.map((y, j) => (j === i ? { ...y, qty: e.target.value } : y)))} />
          <input className="inp" type="number" placeholder="Harga satuan" aria-label="Harga satuan" value={x.unit_price} onChange={(e) => setExtra(extra.map((y, j) => (j === i ? { ...y, unit_price: e.target.value } : y)))} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExtra(extra.filter((_, j) => j !== i))}>Hapus</button></div>))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExtra([...extra, { category: cats[0] || 'Lainnya', description: '', qty: 1, unit_price: '' }])}>+ Tambah biaya (BBM, tol, parkir, tiket…)</button></section>
      <section className="card space-y-1 text-sm">
        <div className="flex justify-between"><span>Total tagihan</span><b>{rp(total)}</b></div>
        <div className="flex justify-between"><span>DP {dpPct}%</span><b>{rp(total * dpPct / 100)}</b></div>
        <div className="flex justify-between"><span>Total modal (rencana)</span><b>{rp(cost)}</b></div>
        <div className="flex justify-between"><span>Estimasi laba</span><b className={total - cost < 0 ? 'text-ember' : 'text-green-800'}>{rp(total - cost)}</b></div></section>
      <Err>{err}</Err>
      <button className="btn btn-ember w-full" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan booking'}</button>
    </form>
  );
}
