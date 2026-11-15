'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Field, Err } from './ui';

export default function Crud({ title, table, select = '*', order = 'created_at', fields, row, searchKeys = [], defaults = {} }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [opts, setOpts] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select(select).order(order, { ascending: false });
    if (error) setErr(error.message);
    setRows(data || []); setLoading(false);
  }, [table, select, order]);

  useEffect(() => {
    load();
    fields.filter((f) => f.optionsFrom).forEach(async (f) => {
      const { table: t, value, label } = f.optionsFrom;
      const { data } = await supabase.from(t).select(`${value},${label}`).order(label);
      setOpts((o) => ({ ...o, [f.name]: (data || []).map((r) => ({ value: r[value], label: r[label] })) }));
    });
  }, [load]);

  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const p = {};
    fields.forEach((f) => {
      let v = form[f.name];
      if (f.type === 'number') v = v === '' || v == null ? (f.zero ? 0 : null) : Number(v);
      else if (f.type === 'checkbox') v = !!v;
      else if (v === '') v = null;
      p[f.name] = v;
    });
    const { error } = form.id ? await supabase.from(table).update(p).eq('id', form.id) : await supabase.from(table).insert(p);
    setBusy(false);
    if (error) { setErr(error.message.includes('duplicate') ? 'Data sudah ada (duplikat).' : error.message); return; }
    setForm(null); load();
  }

  const shown = rows.filter((r) => !q || searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase())));
  const set = (k, v) => setForm((o) => ({ ...o, [k]: v }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h1 className="h1">{title}</h1>
        {!form && <button className="btn btn-sm" onClick={() => { setErr(''); setForm({ ...defaults }); }}>+ Tambah</button>}</div>
      <Err>{err}</Err>
      {form && (
        <form onSubmit={save} className="card space-y-3">
          <div className="font-semibold">{form.id ? 'Ubah data' : 'Data baru'}</div>
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((f) => <Field key={f.name} f={f} value={form[f.name]} onChange={set} options={opts[f.name]} />)}
          </div>
          <div className="flex gap-2"><button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Batal</button></div>
        </form>
      )}
      {searchKeys.length > 0 && <input className="inp" placeholder="Cari…" aria-label="Cari" value={q} onChange={(e) => setQ(e.target.value)} />}
      {loading ? <div className="muted">Memuat…</div> : shown.length === 0 ? <div className="card muted">Belum ada data.</div> : (
        <ul className="space-y-2">{shown.map((r) => (
          <li key={r.id} className="card flex items-start justify-between gap-3"><div className="min-w-0 flex-1">{row(r)}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setErr(''); setForm({ ...r }); }}>Ubah</button></li>
        ))}</ul>
      )}
    </div>
  );
}
