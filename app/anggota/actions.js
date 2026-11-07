'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'
import { emailTeknis } from '@/lib/akun'

export async function tambahAnggota(_prev, fd) {
  const sb = createClient()
  const [{ data: boleh }, { data: ketua }] = await Promise.all([sb.rpc('is_admin_anggota'), sb.rpc('is_ketua')])
  if (!boleh) return { error: 'Hanya Ketua Adat atau Sekretaris yang boleh menambah anggota.' }
  const v = (k) => String(fd.get(k) || '').trim() || null
  const jabatan = v('jabatan') || 'anggota'
  const peran = jabatan === 'pengurus' ? (v('peran') || 'anggota') : 'anggota'
  if (peran === 'founder') return { error: 'Peran ini tidak bisa dibuat lewat web.' }
  const angkatan_id = v('angkatan_id')
  if (!ketua && (peran !== 'anggota' || angkatan_id))
    return { error: 'Peran pengurus dan angkatan hanya bisa diisi Ketua Adat.' }
  const password = String(fd.get('password') || '')
  const nama_adat = v('nama_adat')
  if (!v('nama_lengkap') || !nama_adat) return { error: 'Nama lengkap dan nama adat wajib diisi.' }
  const adm = createAdmin()
  let user_id = null, email_login = null
  if (jabatan !== 'alumni') {
    if (password.length < 8) return { error: 'Password awal minimal 8 karakter.' }
    email_login = emailTeknis(nama_adat)
    const { data, error } = await adm.auth.admin.createUser({ email: email_login, password, email_confirm: true })
    if (error) return { error: 'Gagal membuat akun: ' + error.message }
    user_id = data.user.id
  }
  const { error } = await adm.from('anggota').insert({
    nama_lengkap: v('nama_lengkap'), nama_adat, status: v('status'), jabatan, peran,
    nta: v('nta'), no_hp: v('no_hp'), email: v('email'), angkatan_id,
    user_id, email_login, wajib_ganti_password: true })
  if (error) {
    if (user_id) await adm.auth.admin.deleteUser(user_id)
    return { error: error.code === '23505' ? 'Nama adat, NTA, atau email sudah dipakai.'
      : error.code === '23514' ? 'Pengurus wajib punya NTA, dan alumni tidak punya akun.' : error.message }
  }
  revalidatePath('/anggota')
  return { ok: 'Anggota ditambahkan.' }
}
