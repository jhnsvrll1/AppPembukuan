'use client';
import Crud from '@/components/Crud';
import { rp } from '@/lib/format';
const S = ['Available', 'Reserved', 'On Rental', 'Maintenance', 'Unavailable'].map((x) => ({ value: x, label: x }));
const F = [
  { name: 'type_name', label: 'Tipe mobil (mis. Innova Reborn)', required: true }, { name: 'plate_no', label: 'Plat nomor (unik)', required: true },
  { name: 'supplier_id', label: 'Pemilik / partner', type: 'select', optionsFrom: { table: 'suppliers', value: 'id', label: 'name' } },
  { name: 'capacity', label: 'Kapasitas (penumpang)', type: 'number' }, { name: 'year', label: 'Tahun', type: 'number' },
  { name: 'cost_self_drive', label: 'Modal lepas kunci / hari', type: 'number', zero: true }, { name: 'price_self_drive', label: 'Harga jual lepas kunci / hari', type: 'number', zero: true },
  { name: 'cost_with_driver', label: 'Modal dengan driver / hari', type: 'number', zero: true }, { name: 'price_with_driver', label: 'Harga jual dengan driver / hari', type: 'number', zero: true },
  { name: 'status', label: 'Status', type: 'select', options: S, required: true }, { name: 'notes', label: 'Catatan', type: 'textarea' }
];
export default function Page() {
  return <Crud title="Mobil (per plat)" table="vehicles" select="*, suppliers(name)" order="type_name" fields={F} defaults={{ status: 'Available' }} searchKeys={['type_name', 'plate_no']}
    row={(r) => (<><div className="font-semibold">{r.type_name} · {r.plate_no}</div><div className="muted">Milik: {r.suppliers?.name || '-'} · {r.status}</div>
      <div className="text-xs mt-1">Lepas kunci {rp(r.price_self_drive)} (modal {rp(r.cost_self_drive)})<br />Dengan driver {rp(r.price_with_driver)} (modal {rp(r.cost_with_driver)})</div></>)} />;
}
