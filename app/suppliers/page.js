'use client';
import Crud from '@/components/Crud';
const T = ['rental_partner', 'driver', 'guide', 'hotel', 'restoran', 'watersport', 'fast_boat', 'tiket', 'travel_agent', 'lainnya'].map((x) => ({ value: x, label: x.replace('_', ' ') }));
const P = [{ value: 'upfront', label: 'Bayar di muka' }, { value: 'after_service', label: 'Setelah layanan selesai' }, { value: 'custom', label: 'Sesuai kesepakatan' }];
const F = [
  { name: 'name', label: 'Nama partner', required: true }, { name: 'supplier_type', label: 'Jenis', type: 'select', options: T, required: true },
  { name: 'phone', label: 'Telepon / WhatsApp' }, { name: 'payment_terms', label: 'Syarat pembayaran', type: 'select', options: P, required: true },
  { name: 'payment_terms_note', label: 'Catatan syarat bayar' }, { name: 'notes', label: 'Catatan', type: 'textarea' },
  { name: 'is_active', label: 'Aktif', type: 'checkbox' }
];
export default function Page() {
  return <Crud title="Partner & Supplier" table="suppliers" fields={F} defaults={{ supplier_type: 'rental_partner', payment_terms: 'after_service', is_active: true }} searchKeys={['name', 'phone']}
    row={(r) => (<><div className="font-semibold">{r.name} {!r.is_active && <span className="muted">(nonaktif)</span>}</div>
      <div className="muted">{r.supplier_type?.replace('_', ' ')} · {P.find((x) => x.value === r.payment_terms)?.label}{r.phone ? ' · ' + r.phone : ''}</div></>)} />;
}
