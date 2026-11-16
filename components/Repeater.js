'use client';
export default function Repeater({ items = [], onChange, fields, addLabel = 'Tambah', blank, id = 'r' }) {
  const upd = (i, k, v) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i, d) => { const a = [...items]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line p-3">
          {fields.map((f) => (<div key={f.name}><label className="lbl" htmlFor={`${id}_${f.name}_${i}`}>{f.label}</label>
            {f.type === 'textarea' ? <textarea id={`${id}_${f.name}_${i}`} rows={3} className="inp" value={it[f.name] || ''} onChange={(e) => upd(i, f.name, e.target.value)} />
              : <input id={`${id}_${f.name}_${i}`} className="inp" value={it[f.name] || ''} onChange={(e) => upd(i, f.name, e.target.value)} />}</div>))}
          <div className="flex gap-2"><button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} aria-label="Naik">↑</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} aria-label="Turun">↓</button>
            <button type="button" className="btn btn-ghost btn-sm !text-ember" onClick={() => onChange(items.filter((_, j) => j !== i))}>Hapus</button></div></div>))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...items, { ...blank }])}>+ {addLabel}</button>
    </div>
  );
}
