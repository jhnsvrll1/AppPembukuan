import Logo from '@/components/Logo';
import RequestForm from '@/components/RequestForm';
import { rp } from '@/lib/format';
import { photoUrl } from '@/lib/media';
import { getSite, waHref, waDigits, termsText } from '@/lib/site';

export const revalidate = 60;
export async function generateMetadata() {
  const { site } = await getSite();
  const title = site.meta_title || `${site.company_name || 'JavaBali Travelmate'} — Tour & Rental Mobil`;
  const description = site.meta_description || site.hero_subtitle || 'Paket tour, custom tour, dan rental mobil.';
  const img = photoUrl(site.hero_image);
  return { title, description, openGraph: { title, description, ...(img ? { images: [img] } : {}) } };
}
const Gal = ({ photos, alt }) => (photos?.[0] ? <img src={photoUrl(photos[0])} alt={alt} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" /> : null);

export default async function Pesan() {
  const { site: s, packages, vehicles } = await getSite();
  const wa = waHref(s, 'Halo JavaBali Travelmate, saya ingin bertanya.');
  const hero = photoUrl(s.hero_image);
  return (
    <div className="min-h-screen bg-cream">
      {s.announcement && <div className="bg-ember p-2 text-center text-sm font-semibold text-white">{s.announcement}</div>}
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between p-3"><Logo />
        <nav className="flex items-center gap-1 text-sm" aria-label="Navigasi website">
          {s.show_packages !== false && <a href="#paket" className="hidden px-2 md:inline">Paket</a>}{s.show_rental !== false && <a href="#rental" className="hidden px-2 md:inline">Rental</a>}
          {s.show_faq && <a href="#faq" className="hidden px-2 md:inline">FAQ</a>}<a href="#form" className="btn btn-ember btn-sm">Pesan</a></nav></div></header>
      <main className="mx-auto max-w-5xl space-y-12 p-4 md:p-8">
        <section className="relative overflow-hidden rounded-3xl">
          {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className={`relative space-y-3 px-6 py-14 text-center ${hero ? 'bg-black/50 text-white' : ''}`}>
            <h1 className="text-3xl font-bold md:text-4xl">{s.hero_title || 'Tour & rental mobil di Jawa dan Bali'}</h1>{s.hero_subtitle && <p className={`mx-auto max-w-xl ${hero ? '' : 'text-muted'}`}>{s.hero_subtitle}</p>}
            <div className="flex justify-center gap-2"><a href="#form" className="btn">Kirim permintaan booking</a><a href={wa} target="_blank" rel="noreferrer" className="btn btn-ghost">Chat WhatsApp</a></div></div></section>

        {s.show_packages !== false && (<section id="paket" className="space-y-3"><h2 className="text-xl font-bold">Paket tour</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {packages.map((p) => (<div key={p.id} className="card space-y-2"><Gal photos={p.photos} alt={p.name} /><div className="font-bold">{p.name}</div>
              <div className="muted">{[p.region, `${p.duration_days} hari`].filter(Boolean).join(' · ')}</div>
              {p.description && <p className="line-clamp-3 text-sm">{p.description}</p>}
              <div className="font-semibold text-sea">{p.price_mode === 'fixed' && Number(p.price_per_car_day) > 0 ? `${rp(p.price_per_car_day)} / mobil / hari` : 'Harga sesuai permintaan'}</div>
              {p.price_note && <div className="muted">{p.price_note}</div>}
              <div className="flex gap-2"><a className="btn btn-ghost btn-sm" href={`/pesan/paket/${p.id}`}>Lihat detail</a><a className="btn btn-sm" href={`/pesan?paket=${p.id}#form`}>Pesan paket ini</a></div></div>))}
            <div className="card space-y-2 !border-sea"><div className="font-bold">{s.custom_tour_title || 'Custom tour'}</div><p className="text-sm">{s.custom_tour_text || 'Rute dan itinerary disusun sesuai keinginan Anda. Harga menyesuaikan permintaan.'}</p>
              <div className="font-semibold text-sea">Harga sesuai permintaan</div><a className="btn btn-sm" href="/pesan?custom=1#form">Minta custom tour</a></div></div></section>)}

        {s.show_rental !== false && (<section id="rental" className="space-y-3"><h2 className="text-xl font-bold">Rental mobil</h2>
          {vehicles.length === 0 ? <div className="card muted">Hubungi kami untuk informasi armada.</div> : (
            <div className="grid gap-3 md:grid-cols-3">{vehicles.map((v) => (<div key={v.type_name} className="card space-y-2"><Gal photos={v.photos} alt={v.type_name} /><div className="font-bold">{v.type_name}</div>
              {v.capacity && <div className="muted">Kapasitas {v.capacity} orang</div>}{v.description && <p className="text-sm">{v.description}</p>}
              <div className="text-sm">{v.price_with_driver ? <div>Dengan driver: <b>{rp(v.price_with_driver)}</b> / hari</div> : null}{v.price_self_drive ? <div>Lepas kunci: <b>{rp(v.price_self_drive)}</b> / hari</div> : null}
                {!v.price_with_driver && !v.price_self_drive && <div>Hubungi kami untuk harga</div>}</div>
              <a className="btn btn-sm" href={`/pesan?mobil=${encodeURIComponent(v.type_name)}#form`}>Pilih mobil ini</a></div>))}</div>)}</section>)}

        {s.show_steps !== false && (s.steps || []).length > 0 && (<section className="grid gap-3 md:grid-cols-3">{s.steps.map((st, i) => (
          <div key={i} className="card"><div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-sea font-bold text-white">{i + 1}</div><div className="font-bold">{st.title}</div><p className="text-sm text-muted">{st.desc}</p></div>))}</section>)}

        {s.show_about && s.about_text && (<section className="grid items-center gap-4 md:grid-cols-2">{s.about_image && <img src={photoUrl(s.about_image)} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
          <div className="space-y-2"><h2 className="text-xl font-bold">{s.about_title}</h2><p className="whitespace-pre-line text-sm">{s.about_text}</p></div></section>)}

        {s.show_faq && (s.faqs || []).length > 0 && (<section id="faq" className="space-y-2"><h2 className="text-xl font-bold">Pertanyaan umum</h2>
          {s.faqs.map((q, i) => (<details key={i} className="card"><summary className="cursor-pointer font-semibold">{q.q}</summary><p className="mt-2 whitespace-pre-line text-sm">{q.a}</p></details>))}</section>)}

        {s.show_terms !== false && <section className="card space-y-1"><h2 className="font-bold">Ketentuan pemesanan</h2><p className="text-sm">{termsText(s)}</p></section>}

        <section id="form" className="mx-auto max-w-2xl space-y-3"><h2 className="text-xl font-bold">Kirim permintaan booking</h2>
          <RequestForm packages={packages.map((p) => ({ id: p.id, name: p.name }))} vehicles={vehicles.map((v) => ({ type_name: v.type_name }))} waNumber={waDigits(s.whatsapp_number)} waFallback={s.whatsapp_link || 'https://wa.link/lbixce'} /></section>
      </main>
      <footer className="mt-12 space-y-1 border-t border-line bg-white p-6 text-center text-sm text-muted">
        <div className="flex flex-wrap justify-center gap-3"><a href={wa} className="underline" target="_blank" rel="noreferrer">WhatsApp</a>{s.instagram_url && <a href={s.instagram_url} className="underline" target="_blank" rel="noreferrer">Instagram</a>}{s.email && <a href={`mailto:${s.email}`} className="underline">{s.email}</a>}</div>
        {s.address && <div className="whitespace-pre-line">{s.address}</div>}<div>{s.footer_text || `© ${new Date().getFullYear()} ${s.company_name || 'JavaBali Travelmate'}`}</div></footer>
    </div>
  );
}
