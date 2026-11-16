import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ppydorrbxverzniyulpj.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_aILGS3SLGM6Mx-2lmJk9zw_U5HADFhm';
// Data publik di-cache 60 detik: perubahan dari aplikasi tampil di website dalam kurang lebih 1 menit.
const sb = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (u, o) => fetch(u, { ...o, next: { revalidate: 60 } }) } });

export async function getSite() {
  const [s, p, v] = await Promise.all([
    sb.from('public_site').select('*').maybeSingle(),
    sb.from('public_packages').select('*').order('sort_order').order('name'),
    sb.from('public_vehicle_types').select('*').order('sort_order').order('type_name')]);
  return { site: s.data || {}, packages: p.data || [], vehicles: v.data || [] };
}
export async function getPackage(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await sb.from('public_packages').select('*').eq('id', id).maybeSingle();
  return data;
}
export const waDigits = (n) => { let d = String(n || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); return d; };
export const waHref = (site, text) => (waDigits(site.whatsapp_number) ? `https://wa.me/${waDigits(site.whatsapp_number)}?text=${encodeURIComponent(text || '')}` : site.whatsapp_link || 'https://wa.link/lbixce');
export const termsText = (s) => `DP ${Number(s.dp_percent || 50)}% untuk mengonfirmasi booking, pelunasan saat keberangkatan. Pembatalan H-${s.refund_full_days ?? 2} atau lebih awal: DP kembali ${Number(s.refund_full_percent ?? 100)}%. Pembatalan H-${s.refund_partial_days ?? 1}: DP kembali ${Number(s.refund_partial_percent ?? 50)}%. Pembatalan di hari keberangkatan atau tidak hadir: DP tidak dikembalikan.`;
