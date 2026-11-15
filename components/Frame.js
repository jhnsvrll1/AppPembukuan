'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Logo from './Logo';

const Ctx = createContext(null);
export const useMe = () => useContext(Ctx);
const MAIN = [['/', 'Beranda'], ['/bookings', 'Booking'], ['/calendar', 'Kalender'], ['/finance', 'Keuangan']];
const MORE = [['/customers', 'Pelanggan'], ['/vehicles', 'Mobil'], ['/suppliers', 'Partner'], ['/packages', 'Paket Tour'], ['/backup', 'Backup'], ['/account', 'Akun']];

export default function Frame({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (alive) { setMe(null); setReady(true); } if (path !== '/login') router.replace('/login'); return; }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (!p || !p.is_active) { await supabase.auth.signOut(); return; }
      if (alive) { setMe(p); setReady(true); }
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [path]);

  useEffect(() => setOpen(false), [path]);
  if (path === '/login') return children;
  if (!ready || !me) return <div className="p-8 text-center muted">Memuat…</div>;

  const on = (h) => (h === '/' ? path === '/' : path.startsWith(h));
  const logout = async () => { await supabase.auth.signOut(); router.replace('/login'); };
  const link = (h, t, cls = '') => (
    <Link key={h} href={h} className={`rounded-xl px-3 py-2 text-sm ${on(h) ? 'bg-sea text-white font-semibold' : 'text-ink hover:bg-cream'} ${cls}`}>{t}</Link>
  );

  return (
    <Ctx.Provider value={me}>
      <div className="min-h-screen md:flex">
        <aside className="hidden md:flex md:w-60 shrink-0 flex-col gap-1 border-r border-line bg-white p-4 print:hidden">
          <div className="mb-4"><Logo /></div>
          {MAIN.map(([h, t]) => link(h, t))}
          <div className="muted mt-3 mb-1 px-3">Data</div>
          {MORE.map(([h, t]) => link(h, t))}
          <div className="mt-auto border-t border-line pt-3"><div className="text-sm font-semibold">{me.full_name}</div>
            <div className="muted">@{me.username}</div><button onClick={logout} className="btn btn-ghost btn-sm mt-2 w-full">Keluar</button></div>
        </aside>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-28 md:p-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white md:hidden print:hidden" aria-label="Menu utama">
          {MAIN.map(([h, t]) => (
            <Link key={h} href={h} className={`flex-1 py-4 text-center text-xs ${on(h) ? 'font-bold text-sea shadow-[inset_0_2px_#276E92]' : 'text-muted'}`}>{t}</Link>
          ))}
          <button onClick={() => setOpen(!open)} className={`flex-1 py-4 text-center text-xs ${open ? 'font-bold text-sea' : 'text-muted'}`}>Menu</button>
        </nav>
        {open && (
          <div className="fixed inset-x-0 bottom-14 z-10 border-t border-line bg-white p-4 shadow-lg md:hidden print:hidden">
            <div className="mb-2 text-sm font-semibold">{me.full_name} <span className="muted">@{me.username}</span></div>
            <div className="grid grid-cols-2 gap-2">{MORE.map(([h, t]) => link(h, t, 'border border-line text-center'))}</div>
            <button onClick={logout} className="btn btn-ghost btn-sm mt-3 w-full">Keluar</button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
