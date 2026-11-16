import { supabase } from './supabase';
export const BUCKET = 'site-media';
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ppydorrbxverzniyulpj.supabase.co';
export const photoUrl = (p) => (!p ? null : p.startsWith('http') ? p : `${BASE}/storage/v1/object/public/${BUCKET}/${p}`);

async function compress(file, max = 1600, q = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.')); i.src = url; });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal memproses foto.'))), 'image/jpeg', q));
  } finally { URL.revokeObjectURL(url); }
}
export async function uploadPhoto(file, folder) {
  const blob = await compress(file);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return path;
}
