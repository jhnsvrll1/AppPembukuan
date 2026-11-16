'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { rp, tgl } from '@/lib/format';
import { photoUrl } from '@/lib/media';
import { Field, Err } from '@/components/ui';
import PhotoManager from '@/components/PhotoManager';
import Repeater from '@/components/Repeater';

const lines = (a) => (a || []).join('\n');
const toArr = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
const BLANK = { name: '', region: '', duration_days: 1, price_mode: 'fixed', price_per_car_day: '', price_note: '', cost_per_car_day: '', description: '', highlights: '', itinerary_days: [],
  includes: '', excludes: '', meeting_point: '', terms: '', photos: [], is_active: true, sort_order: 0 };

export default function Packages() {
  const [rows, setRows] = useState([]); const [f, setF] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const { data, error } = await supabase.from('tour_packages').select('*').order('sort_order').order('name'); if (error) setErr(error.message); setRows(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const edit = (r) => { setErr(''); setF({ ...BLANK, ...r, highlights: lines(r.highlights), includes: lines(r.includes), excludes: lines(r.excludes), itinerary_days: r.itinerary_days || [],
    price_per_car_day: r.price_per_car_day ?? '', cost_per_car_day: r.cost_per_car_day ?? '', photos: r.photos || [] }); window.scrollTo({ top: 0 }); };
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const p = { name: f.name, region: f.region || null, duration_days: Number(f.duration_days) || 1, price_mode: f.price_mode, price_per_car_day: Number(f.price_per_car_day) || 0,
      price_note: f.price_note || null, cost_per_car_day: Number(f.cost_per_car_day) || 0, description: f.description || null, highlights: toArr(f.highlights),
      itinerary_days: (f.itinerary_days || []).filter((d) => d.title || d.desc), includes: toArr(f.includes), excludes: toArr(f.excludes), meeting_point: f.meeting_point || null,
      terms: f.terms || null, photos: f.photos, is_active: !!f.is_active, sort_order: Number(f.sort_order) || 0 };
    const { error } = f.id ? await supabase.from('tour_packages').update(p).eq('id', f.id) : await supabase.from('tour_packages').insert(p);
    setBusy(false); if (error) return setErr(error.message); setF(null); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h1 className="h1">Paket tour</h1>{!f && <button className="btn btn-sm" onClick={() => { setErr(''); setF({ ...BLANK }); }}>+ Tambah paket</button>}</div>
      <Err>{err}</Err>
      {f && (
        <form onSubmit={save} className="card space-y-4">
          <div className="font-bold">{f.id ? 'Ubah paket' : 'Paket baru'}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field f={{ name: 'name', label: 'Nama paket', required: true }} value={f.name} onChange={set} />
            <Field f={{ name: 'region', label: 'Wilayah (Bromo, Malang, Bali…)' }} value={f.region} onChange={set} />
            <Field f={{ name: 'duration_days', label: 'Durasi (hari)', type: 'number', required: true }} value={f.duration_days} onChange={set} />
            <Field f={{ name: 'sort_order', label: 'Urutan tampil (kecil = lebih atas)', type: 'number' }} value={f.sort_order} onChange={set} />
            <Field f={{ name: 'price_mode', label: 'Tampilan harga di website', type: 'select', required: true, options: [{ value: 'fixed', label: 'Tampilkan harga' }, { value: 'request', label: 'Harga sesuai permintaan' }] }} value={f.price_mode} onChange={set} />
            <Field f={{ name: 'price_per_car_day', label: 'Harga jual per mobil per hari', type: 'number' }} value={f.price_per_car_day} onChange={set} />
            <Field f={{ name: 'price_note', label: 'Catatan harga (mis. maks 6 orang, belum termasuk tiket)' }} value={f.price_note} onChange={set} />
            <Field f={{ name: 'cost_per_car_day', label: 'Modal per mobil per hari (internal, tidak tampil)', type: 'number' }} value={f.cost_per_car_day} onChange={set} />
          </div>
          <Field f={{ name: 'description', label: 'Deskripsi singkat', type: 'textarea' }} value={f.description} onChange={set} />
          <Field f={{ name: 'highlights', label: 'Daya tarik utama (satu per baris)', type: 'textarea' }} value={f.highlights} onChange={set} />
          <div><div className="lbl">Itinerary per hari / per sesi</div>
            <Repeater id="it" items={f.itinerary_days} onChange={(v) => set('itinerary_days', v)} addLabel="Tambah hari / sesi" blank={{ title: '', desc: '' }}
              fields={[{ name: 'title', label: 'Judul (mis. Hari 1 · Sunrise Bromo)' }, { name: 'desc', label: 'Uraian', type: 'textarea' }]} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field f={{ name: 'includes', label: 'Sudah termasuk (satu per baris)', type: 'textarea' }} value={f.includes} onChange={set} />
            <Field f={{ name: 'excludes', label: 'Belum termasuk (satu per baris)', type: 'textarea' }} value={f.excludes} onChange={set} /></div>
          <Field f={{ name: 'meeting_point', label: 'Titik kumpul / area penjemputan' }} value={f.meeting_point} onChange={set} />
          <Field f={{ name: 'terms', label: 'Ketentuan khusus paket', type: 'textarea' }} value={f.terms} onChange={set} />
          <PhotoManager value={f.photos} onChange={(v) => set('photos', v)} folder="paket" max={12} label="Foto paket" />
          <Field f={{ name: 'is_active', label: 'Tampil di website dan bisa dipesan', type: 'checkbox' }} value={f.is_active} onChange={set} />
          <div className="flex gap-2"><button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button><button type="button" className="btn btn-ghost" onClick={() => setF(null)}>Batal</button></div>
        </form>)}
      {rows.length === 0 ? <div className="card muted">Belum ada paket.</div> : rows.map((r) => (
        <div key={r.id} className="card flex gap-3">
          {r.photos?.[0] ? <img src={photoUrl(r.photos[0])} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" /> : <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-cream text-xs text-muted">Tanpa foto</div>}
          <div className="min-w-0 flex-1 text-sm"><div className="font-semibold">{r.name} {!r.is_active && <span className="muted">(tidak tampil)</span>}</div>
            <div className="muted">{r.region} · {r.duration_days} hari · {r.price_mode === 'request' ? 'harga sesuai permintaan' : `${rp(r.price_per_car_day)} / mobil / hari`}</div>
            <div className="muted">Modal {rp(r.cost_per_car_day)} · {r.photos?.length || 0} foto</div></div>
          <button className="btn btn-ghost btn-sm self-start" onClick={() => edit(r)}>Ubah</button></div>))}
    </div>
  );
}
