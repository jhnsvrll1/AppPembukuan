'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useMe } from '@/components/Frame';
import { Err } from '@/components/ui';

export default function Account() {
  const me = useMe();
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  async function save(e) {
    e.preventDefault(); setErr(''); setOk('');
    if (p1.length < 10) return setErr('Password minimal 10 karakter.');
    if (p1 !== p2) return setErr('Konfirmasi password tidak sama.');
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) return setErr(error.message); setOk('Password berhasil diganti.'); setP1(''); setP2('');
  }
  return (
    <div className="space-y-3"><h1 className="h1">Akun saya</h1>
      <div className="card text-sm"><b>{me.full_name}</b><div className="muted">@{me.username} · {me.role}</div></div>
      <form onSubmit={save} className="card space-y-3"><div className="font-bold">Ganti password</div>
        <div><label htmlFor="n1" className="lbl">Password baru</label><input id="n1" type="password" className="inp" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} /></div>
        <div><label htmlFor="n2" className="lbl">Ulangi password baru</label><input id="n2" type="password" className="inp" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} /></div>
        <Err>{err}</Err>{ok && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-900">{ok}</div>}<button className="btn">Simpan password</button></form></div>
  );
}
