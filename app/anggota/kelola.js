'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'
import { emailTeknis, bolehKelola } from '@/lib/akun'

const pesan = (e) => e.code === '23505' ? 'Nama adat, NTA, atau email sudah dipakai.'
  : e.code === '23514' ? 'Pengurus wajib punya NTA, dan alumni tidak punya akun.' : e.message

// Pemeriksaan wewenang yang dipakai semua aksi
async function izin(id) {
  const sb = createClient()
  const [{ data: saya }, { data: admin }, { data: ketua }, { data: { user } }] = await Promise.all([
    sb.rpc('peran_saya'), sb.rpc('is_admin_anggota'), sb.rpc('is_ketua'), sb.auth.getUser()])
  if (!user || !admin) return { error: 'Hanya Ketua Adat, Founder, atau Sekretaris yang boleh mengelola anggota.' }
  const { data: t } = await createAdmin().from('anggota').select('*').eq('id', id).maybeSingle()
  if (!t) return { error: 'Anggota tidak ditemukan.' }
  if (!bolehKelola(saya, t.peran)) return { error: 'Kamu tidak berwenang mengelola anggota ini.' }
  return { t, ketua, uid: user.id }
}

export async function simpanAnggota(_prev, fd) {
  const z = await izin(String(fd.get('id') || ''))
  if (z.error) return z
  const { t, ketua } = z
  const v = (k) => String(fd.get(k) || '').trim() || null
  const jabatan = v('jabatan') || t.jabatan
  const founder = t.peran === 'founder'
  const upd = { nama_lengkap: v('nama_lengkap'), nama_adat: v('nama_adat'), status: v('status'), jabatan,
    nta: v('nta'), no_hp: v('no_hp'), email: v('email'), aktif: fd.get('aktif') === 'on' }
  if (!upd.nama_lengkap || !upd.nama_adat) return { error: 'Nama lengkap dan nama adat wajib diisi.' }
  if (t.user_id === z.uid) upd.aktif = true            // tidak bisa menonaktifkan diri sendiri
  if (ketua && fd.has('angkatan_id')) upd.angkatan_id = v('angkatan_id')
  if (!founder) {
    if (ketua && fd.has('peran')) upd.peran = jabatan === 'pengurus' ? (v('peran') || 'anggota') : 'anggota'
    else if (jabatan !== 'pengurus') upd.peran = 'anggota'
    if (upd.peran === 'founder') return { error: 'Peran Founder tidak bisa diberikan lewat web.' }
  }
  const adm = createAdmin()
  const tanpaAkun = jabatan === 'alumni' && !founder       // alumni = data saja
  let baruId = null
  if (tanpaAkun) { upd.user_id = null; upd.email_login = null }
  else if (!t.user_id) {
    const password = String(fd.get('password') || '')
    if (password.length < 8) return { error: 'Anggota ini belum punya akun. Isi password awal (min. 8 karakter).' }
    upd.email_login = emailTeknis(upd.nama_adat)
    const { data, error } = await adm.auth.admin.createUser({ email: upd.email_login, password, email_confirm: true })
    if (error) return { error: 'Gagal membuat akun: ' + error.message }
    baruId = upd.user_id = data.user.id; upd.wajib_ganti_password = true
  }
  const { error } = await adm.from('anggota').update(upd).eq('id', t.id)
  if (error) { if (baruId) await adm.auth.admin.deleteUser(baruId); return { error: pesan(error) } }
  if (tanpaAkun && t.user_id) await adm.auth.admin.deleteUser(t.user_id)
  revalidatePath('/anggota')
  return { ok: 'Perubahan disimpan.' }
}

export async function resetPassword(_prev, fd) {
  const z = await izin(String(fd.get('id') || ''))
  if (z.error) return z
  const p = String(fd.get('password') || '')
  if (!z.t.user_id) return { error: 'Anggota ini tidak punya akun.' }
  if (p.length < 8) return { error: 'Password minimal 8 karakter.' }
  const adm = createAdmin()
  const { error } = await adm.auth.admin.updateUserById(z.t.user_id, { password: p })
  if (error) return { error: error.message }
  await adm.from('anggota').update({ wajib_ganti_password: true }).eq('id', z.t.id)
  return { ok: 'Password diatur ulang. Anggota wajib menggantinya saat login.' }
}

export async function hapusAnggota(fd) {
  const z = await izin(String(fd.get('id') || ''))
  if (z.error || z.t.peran === 'founder' || z.t.user_id === z.uid) return
  const adm = createAdmin()
  await adm.from('anggota').delete().eq('id', z.t.id)
  if (z.t.user_id) await adm.auth.admin.deleteUser(z.t.user_id)
  revalidatePath('/anggota')
  redirect('/anggota')
}
