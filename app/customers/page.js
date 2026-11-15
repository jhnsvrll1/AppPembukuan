'use client';
import Crud from '@/components/Crud';
import { waLink } from '@/lib/format';
const F = [
  { name: 'name', label: 'Nama', required: true }, { name: 'whatsapp', label: 'Nomor WhatsApp' },
  { name: 'email', label: 'Email', type: 'email' }, { name: 'country', label: 'Negara asal' },
  { name: 'source', label: 'Sumber pelanggan', type: 'select', options: ['WhatsApp', 'Instagram', 'Google', 'Referensi teman', 'Lainnya'].map((x) => ({ value: x, label: x })) },
  { name: 'notes', label: 'Catatan', type: 'textarea' }
];
export default function Page() {
  return <Crud title="Pelanggan" table="customers" fields={F} defaults={{ country: 'Indonesia' }} searchKeys={['name', 'whatsapp', 'email']}
    row={(r) => (<><div className="font-semibold">{r.name}</div><div className="muted">{r.country} {r.source ? '· ' + r.source : ''}</div>
      {r.whatsapp && <a className="text-sm text-sea underline" href={waLink(r.whatsapp, `Halo ${r.name}, `)} target="_blank" rel="noreferrer">{r.whatsapp} (chat)</a>}</>)} />;
}
