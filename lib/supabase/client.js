import { createBrowserClient } from '@supabase/ssr'
// Dipakai di komponen client HANYA untuk mengunggah berkas ke Storage (memakai sesi login pengguna).
export const createClient = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
