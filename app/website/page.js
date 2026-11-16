'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Field, Err } from '@/components/ui';
import PhotoManager from '@/components/PhotoManager';
import Repeater from '@/components/Repeater';

const KEYS = ['hero_title', 'hero_subtitle', 'hero_image', 'announcement', 'custom_tour_title', 'custom_tour_text', 'about_title', 'about_text', 'about_image', 'steps', 'faqs', 'whatsapp_number',
  'instagram_url', 'email', 'address', 'footer_text', 'meta_title', 'meta_description', 'show_packages', 'show_rental', 'show_steps', 'show_about', 'show_faq', 'show_terms'];

export default function Website() {
  const [s, setS] = useState(null); const [types, setTypes] = useState([]); const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([supabase.from('site_settings').select('*').eq('id', 1).single(), supabase.from('vehicles').select('type_name'), supabase.from('vehicle_type_info').select('*')]);
      if (a.error) setErr(a.error.message); setS(a.data);
      const info = Object.fromEntries((c.data || []).map((x) => [x.type_name, x]));
      setTypes([...new Set((b.data || []).map((x) => x.type_name))].sort().map((n) => ({ type_name: n, description: info[n]?.description || '', photos: info[n]?.photos || [], is_published: info[n] ? info[n].is_published : true, sort_order: info[n]?.sort_order || 0 })));
    })();
  }, []);
  const set = (k, v) => setS((o) => ({ ...o, [k]: v }));
  const T = (name, label, type) => <Field f={{ name, label, type }} value={s[name]} onChange={set} />;
  const CB = (name, label) => <Field f={{ name, label, type: 'checkbox' }} value={s[name]} onChange={set} />;
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr(''); setOk('');
    const p = {}; KEYS.forEach((k) => { const v = s[k]; p[k] = typeof v === 'string' ? (v.trim() === '' ? null : v) : v; });
    p.steps = (s.steps || []).filter((x) => x.title || x.desc); p.faqs = (s.faqs || []).filter((x) => x.q || x.a);
    const { error } = await supabase.from('site_settings').update(p).eq('id', 1);
    setBusy(false); if (error) setErr(error.message); else setOk('Tersimpan. Perubahan tampil di website dalam kurang lebih 1 menit.');
  }
  async function saveType(t) {
    setErr(''); setOk('');
    const { error } = await supabase.from('vehicle_type_info').upsert({ type_name: t.type_name, description: t.description || null, photos: t.photos, is_published: t.is_published, sort_order: Number(t.sort_order) || 0 }, { onConflict: 'type_name' });
    if (error) setErr(error.message); else setOk(`Etalase ${t.type_name} tersimpan.`);
  }
  const setT = (i, k, v) => setTypes((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  if (!s) return <div>{err ? <Err>{err}</Err> : <div className="muted">Memuat…</div>}</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="h1">Pengaturan website</h1><a className="btn btn-ghost btn-sm" href="/pesan" target="_blank" rel="noreferrer">Lihat website</a></div>
      <Err>{err}</Err>{ok && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-900" role="status">{ok}</div>}
      <p className="muted">Paket tour diatur di menu <b>Paket Tour</b>, harga mobil di menu <b>Mobil</b>. Halaman ini untuk teks, foto, dan tampilan website.</p>
      <form onSubmit={save} className="space-y-4">
        <section className="card space-y-3"><h2 className="font-bold">Bagian atas (hero)</h2>{T('hero_title', 'Judul besar')}{T('hero_subtitle', 'Kalimat pendukung', 'textarea')}
          <PhotoManager single value={s.hero_image ? [s.hero_image] : []} onChange={(a) => set('hero_image', a[0] || null)} folder="situs" label="Foto latar" />
          {T('announcement', 'Pengumuman / promo (kosongkan bila tidak ada)')}</section>
        <section className="card space-y-3"><h2 className="font-bold">Custom tour</h2>{T('custom_tour_title', 'Judul')}{T('custom_tour_text', 'Uraian', 'textarea')}</section>
        <section className="card space-y-3"><h2 className="font-bold">Langkah pemesanan</h2>
          <Repeater id="st" items={s.steps} onChange={(v) => set('steps', v)} addLabel="Tambah langkah" blank={{ title: '', desc: '' }} fields={[{ name: 'title', label: 'Judul' }, { name: 'desc', label: 'Uraian', type: 'textarea' }]} /></section>
        <section className="card space-y-3"><h2 className="font-bold">Tentang kami</h2>{T('about_title', 'Judul')}{T('about_text', 'Isi (tulis sendiri sesuai kenyataan usahamu)', 'textarea')}
          <PhotoManager single value={s.about_image ? [s.about_image] : []} onChange={(a) => set('about_image', a[0] || null)} folder="situs" label="Foto" /></section>
        <section className="card space-y-3"><h2 className="font-bold">Pertanyaan umum (FAQ)</h2>
          <Repeater id="fq" items={s.faqs} onChange={(v) => set('faqs', v)} addLabel="Tambah pertanyaan" blank={{ q: '', a: '' }} fields={[{ name: 'q', label: 'Pertanyaan' }, { name: 'a', label: 'Jawaban', type: 'textarea' }]} /></section>
        <section className="card space-y-3"><h2 className="font-bold">Kontak</h2>
          {T('whatsapp_number', 'Nomor WhatsApp (mis. 0812…) agar pesan otomatis terisi')}<div className="muted">Bila kosong, tombol memakai link wa.link di Pengaturan Perusahaan.</div>
          {T('instagram_url', 'Link Instagram')}{T('email', 'Email')}{T('address', 'Alamat / kota basis', 'textarea')}{T('footer_text', 'Teks bagian bawah')}</section>
        <section className="card space-y-3"><h2 className="font-bold">Mesin pencari & pratinjau link</h2>{T('meta_title', 'Judul halaman')}{T('meta_description', 'Deskripsi singkat (±150 huruf)', 'textarea')}</section>
        <section className="card space-y-2"><h2 className="font-bold">Bagian yang ditampilkan</h2>
          {CB('show_packages', 'Paket tour')}{CB('show_rental', 'Rental mobil')}{CB('show_steps', 'Langkah pemesanan')}{CB('show_about', 'Tentang kami')}{CB('show_faq', 'FAQ')}{CB('show_terms', 'Ketentuan pemesanan (otomatis dari aturan DP dan refund)')}</section>
        <button className="btn w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan pengaturan website'}</button>
      </form>
      <section className="space-y-3"><h2 className="text-lg font-bold">Etalase mobil</h2>
        <p className="muted">Satu kartu per tipe mobil di website. Plat dan harga modal tidak pernah ditampilkan.</p>
        {types.length === 0 ? <div className="card muted">Belum ada mobil. Tambahkan di menu Mobil.</div> : types.map((t, i) => (
          <div key={t.type_name} className="card space-y-3"><div className="font-bold">{t.type_name}</div>
            <Field f={{ name: 'description', label: 'Deskripsi', type: 'textarea' }} value={t.description} onChange={(k, v) => setT(i, k, v)} />
            <PhotoManager value={t.photos} onChange={(v) => setT(i, 'photos', v)} folder="mobil" max={8} label="Foto mobil" />
            <div className="grid gap-3 md:grid-cols-2"><Field f={{ name: 'sort_order', label: 'Urutan tampil', type: 'number' }} value={t.sort_order} onChange={(k, v) => setT(i, k, v)} />
              <Field f={{ name: 'is_published', label: 'Tampil di website', type: 'checkbox' }} value={t.is_published} onChange={(k, v) => setT(i, k, v)} /></div>
            <button className="btn btn-sm" onClick={() => saveType(t)}>Simpan {t.type_name}</button></div>))}</section>
    </div>
  );
}
