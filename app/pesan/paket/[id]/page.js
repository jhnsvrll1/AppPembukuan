import { notFound } from 'next/navigation';
import Logo from '@/components/Logo';
import { rp } from '@/lib/format';
import { photoUrl } from '@/lib/media';
import { getPackage, getSite, waHref, termsText } from '@/lib/site';

export const revalidate = 60;
export async function generateMetadata({ params }) {
  const p = await getPackage(params.id); if (!p) return { title: 'Paket tidak ditemukan' };
  const img = photoUrl(p.photos?.[0]); const description = p.description || `Paket ${p.name} dari JavaBali Travelmate.`;
  return { title: `${p.name} — JavaBali Travelmate`, description, openGraph: { title: p.name, description, ...(img ? { images: [img] } : {}) } };
}
const List = ({ title, items, mark }) => (items?.length ? (<div className="card space-y-1"><h2 className="font-bold">{title}</h2><ul className="space-y-1 text-sm">{items.map((x, i) => <li key={i}>{mark} {x}</li>)}</ul></div>) : null);

export default async function Paket({ params }) {
  const p = await getPackage(params.id); if (!p) notFound();
  const { site: s } = await getSite(); const wa = waHref(s, `Halo JavaBali Travelmate, saya ingin bertanya tentang paket ${p.name}.`);
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between p-3"><a href="/pesan" aria-label="Kembali ke beranda"><Logo /></a><a href="/pesan" className="btn btn-ghost btn-sm">← Semua paket</a></div></header>
      <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
        {p.photos?.length > 0 && <div className="flex snap-x gap-2 overflow-x-auto">{p.photos.map((x, i) => <img key={x} src={photoUrl(x)} alt={`${p.name} ${i + 1}`} loading={i ? 'lazy' : 'eager'} className="aspect-[4/3] min-w-[85%] snap-center rounded-2xl object-cover md:min-w-[48%]" />)}</div>}
        <div className="space-y-1"><h1 className="text-2xl font-bold">{p.name}</h1><div className="muted">{[p.region, `${p.duration_days} hari`].filter(Boolean).join(' · ')}</div>
          <div className="text-lg font-semibold text-sea">{p.price_mode === 'fixed' && Number(p.price_per_car_day) > 0 ? `${rp(p.price_per_car_day)} / mobil / hari` : 'Harga sesuai permintaan'}</div>
          {p.price_note && <div className="muted">{p.price_note}</div>}</div>
        {p.description && <p className="whitespace-pre-line text-sm">{p.description}</p>}
        <List title="Daya tarik utama" items={p.highlights} mark="★" />
        {(p.itinerary_days || []).length > 0 && (<div className="card space-y-3"><h2 className="font-bold">Itinerary</h2>{p.itinerary_days.map((d, i) => (<div key={i}><div className="font-semibold">{d.title}</div><p className="whitespace-pre-line text-sm text-muted">{d.desc}</p></div>))}</div>)}
        <div className="grid gap-3 md:grid-cols-2"><List title="Sudah termasuk" items={p.includes} mark="✓" /><List title="Belum termasuk" items={p.excludes} mark="–" /></div>
        {p.meeting_point && <div className="card text-sm"><b>Titik kumpul:</b> {p.meeting_point}</div>}
        {p.terms && <div className="card text-sm"><b>Ketentuan paket:</b><p className="whitespace-pre-line">{p.terms}</p></div>}
        {s.show_terms !== false && <div className="card text-sm"><b>Ketentuan pemesanan:</b><p>{termsText(s)}</p></div>}
        <div className="sticky bottom-3 flex gap-2"><a className="btn btn-ember flex-1" href={`/pesan?paket=${p.id}#form`}>Pesan paket ini</a><a className="btn btn-ghost" href={wa} target="_blank" rel="noreferrer">WhatsApp</a></div>
      </main>
    </div>
  );
}
