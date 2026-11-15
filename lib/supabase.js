import { createClient } from '@supabase/supabase-js';
// URL dan publishable key bersifat publik. Keamanan data dijaga oleh Row Level Security di database.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ppydorrbxverzniyulpj.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_aILGS3SLGM6Mx-2lmJk9zw_U5HADFhm';
export const supabase = createClient(url, key);
