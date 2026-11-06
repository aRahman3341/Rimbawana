'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export async function gantiPassword(_prev, fd) {
  const p1 = String(fd.get('baru') || ''), p2 = String(fd.get('ulang') || '')
  if (p1.length < 8) return { error: 'Password minimal 8 karakter.' }
  if (p1 !== p2) return { error: 'Konfirmasi password tidak sama.' }
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { error } = await sb.auth.updateUser({ password: p1 })
  if (error) return { error: error.message }
  await sb.from('anggota').update({ wajib_ganti_password: false }).eq('user_id', user.id)
  redirect('/dashboard')
}
