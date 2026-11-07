import { createClient } from '@supabase/supabase-js'
// Next.js diam-diam menyimpan cache hasil fetch. Untuk data hidup (stok, kas, chat) itu berbahaya,
// jadi semua permintaan ke Supabase dari server dipaksa tanpa cache.
export const tanpaCache = (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' })
// Hanya dipakai di server (server action / halaman server). Melewati RLS - jangan pernah diimpor di komponen client.
export const createAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: tanpaCache } })
