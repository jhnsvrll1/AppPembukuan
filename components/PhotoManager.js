'use client';
import { useState } from 'react';
import { photoUrl, uploadPhoto } from '@/lib/media';

export default function PhotoManager({ value = [], onChange, folder, max = 12, single = false, label = 'Foto' }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function add(e) {
    const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
    setBusy(true); setErr('');
    try {
      let next = single ? [] : [...value];
      for (const f of files) { if (next.length >= max) break; next.push(await uploadPhoto(f, folder)); if (single) break; }
      onChange(next);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  const move = (i, d) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="space-y-2">
      <div className="lbl">{label}{!single && ' (foto pertama jadi sampul)'}</div>
      {value.length > 0 && <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{value.map((p, i) => (
        <div key={p} className="space-y-1 rounded-xl border border-line p-1">
          <img src={photoUrl(p)} alt={`${label} ${i + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
          <div className="flex items-center justify-between gap-1">
            {!single && <><button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => move(i, -1)} aria-label="Geser ke kiri">←</button>
              <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => move(i, 1)} aria-label="Geser ke kanan">→</button></>}
            <button type="button" className="btn btn-ghost btn-sm !text-ember" onClick={() => onChange(value.filter((_, j) => j !== i))}>Hapus</button></div>
          {i === 0 && !single && <div className="chip bg-sky-100 text-sky-900">Sampul</div>}</div>))}</div>}
      {(single || value.length < max) && (
        <label className={`btn btn-ghost btn-sm cursor-pointer ${busy ? 'opacity-50' : ''}`}>{busy ? 'Mengunggah…' : single ? 'Pilih foto' : '+ Tambah foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} className="sr-only" disabled={busy} onChange={add} /></label>)}
      {err && <div role="alert" className="text-sm text-red-800">{err}</div>}
      <div className="muted">Foto dikecilkan otomatis agar hemat penyimpanan. Klik Simpan agar perubahan tampil di website.</div>
    </div>
  );
}
