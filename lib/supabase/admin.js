import { createClient } from '@supabase/supabase-js'
// Hanya dipakai di server (server action). Melewati RLS - jangan pernah diimpor di komponen client.
export const createAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } })
