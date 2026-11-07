'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, pesanDb } from '@/lib/db'
import { bacaBerkas } from '@/lib/berkas'

const JENIS = ['foto', 'video', 'album', 'dokumen']
const segar = () => { revalidatePath('/media'); revalidatePath('/galeri') }

// Media disimpan sebagai TAUTAN: link Google Drive (file besar, video, atau folder album) atau foto kecil di Storage.
export async function tambahMedia(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const jenis = teks(fd, 'jenis'), judul = teks(fd, 'judul'), tanggal = teks(fd, 'tanggal')
  if (!JENIS.includes(jenis) || !judul) return { error: 'Jenis dan judul wajib diisi.' }
  if (tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { error: 'Tanggal tidak valid.' }
  const f = await bacaBerkas(fd, 'media', 'galeri/', { bucket: 'foto', izinFolder: jenis === 'album' })
  if (f.error) return f
  if (!f.path && !f.url) return { error: 'Tempel link Google Drive atau unggah foto.' }
  const { error } = await admin().from('media_rimbawana').insert({
    jenis, judul, deskripsi: teks(fd, 'deskripsi'), tanggal, drive_url: f.url || null, drive_id: f.drive_id || null,
    drive_nama: f.url ? f.nama : null, drive_ukuran: f.url ? f.ukuran ?? null : null, foto_path: f.path || null, dibuat_oleh: z.saya.id })
  if (error) return { error: pesanDb(error) }
  segar(); return { ok: 'Media ditambahkan.' }
}
export async function ubahTampil(fd) {
  const z = await izinAksi('profil'); if (z.error) return
  await admin().from('media_rimbawana').update({ tampil: fd.get('tampil') === '1' }).eq('id', teks(fd, 'id')); segar()
}
export async function hapusMedia(fd) {
  const z = await izinAksi('profil'); if (z.error) return
  const adm = admin(), id = teks(fd, 'id')
  const { data: m } = await adm.from('media_rimbawana').select('foto_path').eq('id', id).maybeSingle()
  await adm.from('media_rimbawana').delete().eq('id', id)
  if (m?.foto_path) await adm.storage.from('foto').remove([m.foto_path])
  segar()
}
