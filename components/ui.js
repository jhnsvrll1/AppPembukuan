'use client';
import { STATUS_STYLE } from '@/lib/format';
export const Chip = ({ s, cls }) => <span className={`chip ${cls || STATUS_STYLE[s] || 'bg-stone-200 text-stone-700'}`}>{s}</span>;
export const Err = ({ children }) => (children ? <div role="alert" className="rounded-xl bg-red-50 text-red-800 text-sm p-3">{children}</div> : null);
export function Field({ f, value, onChange, options }) {
  const id = 'f_' + f.name;
  if (f.type === 'checkbox')
    return (<div className="flex items-center gap-2"><input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(f.name, e.target.checked)} /><label htmlFor={id} className="text-sm">{f.label}</label></div>);
  const common = { id, value: value ?? '', onChange: (e) => onChange(f.name, e.target.value), required: f.required, className: 'inp' };
  return (
    <div>
      <label htmlFor={id} className="lbl">{f.label}{f.required ? ' *' : ''}</label>
      {f.type === 'textarea' ? <textarea rows={3} {...common} /> :
       f.type === 'select' ? (
        <select {...common}>{!f.required && <option value="">— pilih —</option>}{(options || f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
       ) : <input type={f.type || 'text'} step={f.type === 'number' ? 'any' : undefined} {...common} />}
    </div>
  );
}
