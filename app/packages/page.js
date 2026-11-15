'use client';
import Crud from '@/components/Crud';
import { rp } from '@/lib/format';
const F = [
  { name: 'name', label: 'Nama paket', required: true }, { name: 'region', label: 'Wilayah (Bromo, Malang, Bali…)' },
  { name: 'duration_days', label: 'Durasi (hari)', type: 'number', required: true, zero: true },
  { name: 'price_per_car_day', label: 'Harga jual per mobil per hari', type: 'number', zero: true },
  { name: 'cost_per_car_day', label: 'Modal per mobil per hari', type: 'number', zero: true },
  { name: 'description', label: 'Deskripsi', type: 'textarea' }, { name: 'itinerary', label: 'Itinerary', type: 'textarea' },
  { name: 'facilities', label: 'Fasilitas', type: 'textarea' }, { name: 'terms', label: 'Ketentuan', type: 'textarea' },
  { name: 'is_active', label: 'Aktif (tampil saat booking)', type: 'checkbox' }
];
export default function Page() {
  return <Crud title="Paket Tour" table="tour_packages" fields={F} defaults={{ duration_days: 1, is_active: true }} searchKeys={['name', 'region']}
    row={(r) => (<><div className="font-semibold">{r.name} {!r.is_active && <span className="muted">(nonaktif)</span>}</div>
      <div className="muted">{r.region} · {r.duration_days} hari</div><div className="text-xs mt-1">Harga {rp(r.price_per_car_day)} / mobil / hari · modal {rp(r.cost_per_car_day)}</div></>)} />;
}
