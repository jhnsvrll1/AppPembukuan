'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';
import { Err } from '@/components/ui';

export default function Login() {
  const router = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace('/'); }); }, []);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: `${u.trim().toLowerCase()}@javabali.app`, password: p });
    setBusy(false);
    if (error) { setErr('Username atau password salah.'); return; }
    router.replace('/');
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2"><Logo size={84} text={false} />
        <div className="text-center"><div className="text-2xl font-bold">JavaBali</div><div className="text-xs tracking-[0.3em] text-muted">TRAVELMATE</div></div></div>
      <form onSubmit={submit} className="card w-full space-y-4">
        <div className="font-bold">Masuk ke sistem</div>
        <div><label htmlFor="u" className="lbl">Username</label><input id="u" className="inp" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required /></div>
        <div><label htmlFor="p" className="lbl">Password</label><input id="p" type="password" className="inp" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required /></div>
        <Err>{err}</Err>
        <button className="btn w-full" disabled={busy}>{busy ? 'Masuk…' : 'Masuk'}</button>
      </form>
      <p className="muted text-center">Akses khusus owner JavaBali Travelmate.</p>
    </div>
  );
}
