'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'

export async function masuk(_prev, fd) {
  const nama = String(fd.get('nama_adat') || '').trim()
  const password = String(fd.get('password') || '')
  const salah = { error: 'Nama adat atau password salah.' }
  if (!nama || !password) return salah
  const { data: a } = await createAdmin().from('anggota')
    .select('email_login, aktif, wajib_ganti_password')
    .ilike('nama_adat', nama.replace(/[\\%_]/g, '\\$&')).not('user_id', 'is', null).maybeSingle()
  if (!a || !a.aktif || !a.email_login) return salah
  const { error } = await createClient().auth.signInWithPassword({ email: a.email_login, password })
  if (error) return salah
  redirect(a.wajib_ganti_password ? '/ganti-password' : '/dashboard')
}
export async function keluar() { await createClient().auth.signOut(); redirect('/') }
