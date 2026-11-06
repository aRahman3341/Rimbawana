'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, angka, pathAman, pesanDb } from '@/lib/db'

const segar = (id) => { revalidatePath('/kegiatan'); if (id) revalidatePath(`/kegiatan/${id}`); revalidatePath('/dashboard') }
const TGL = /^\d{4}-\d{2}-\d{2}$/

function baca(fd) {
  const nama = teks(fd, 'nama'), rab = teks(fd, 'rab'), mulai = teks(fd, 'tgl_mulai'), selesai = teks(fd, 'tgl_selesai')
  if (!nama) return { error: 'Nama kegiatan wajib diisi.' }
  if (!pathAman(rab, 'rab/')) return { error: 'Berkas RAB tidak valid.' }
  if ((mulai && !TGL.test(mulai)) || (selesai && !TGL.test(selesai))) return { error: 'Tanggal tidak valid.' }
  if (mulai && selesai && selesai < mulai) return { error: 'Tanggal selesai harus setelah tanggal mulai.' }
  return { v: { nama, deskripsi: teks(fd, 'deskripsi'), tempat: teks(fd, 'tempat'), tgl_mulai: mulai, tgl_selesai: selesai, total_rab: Math.max(angka(fd, 'total_rab'), 0) }, rab }
}

export async function tambahKegiatan(_p, fd) {
  const z = await izinAksi('pengurus'); if (z.error) return z
  const b = baca(fd); if (b.error) return b
  const { data, error } = await admin().from('kegiatan_rab').insert({ ...b.v, rab_path: b.rab, status_rab: b.rab ? 'diajukan' : 'draft', dibuat_oleh: z.saya.id }).select('id').single()
  if (error) return { error: pesanDb(error) }
  segar(); redirect(`/kegiatan/${data.id}`)
}

export async function ubahKegiatan(_p, fd) {
  const z = await izinAksi('pengurus'); if (z.error) return z
  const id = teks(fd, 'id'), b = baca(fd); if (b.error) return b
  const adm = admin()
  const { data: k } = await adm.from('kegiatan_rab').select('status_rab').eq('id', id).maybeSingle()
  if (!k) return { error: 'Kegiatan tidak ditemukan.' }
  if (k.status_rab === 'disetujui') return { error: 'RAB yang sudah disetujui dikunci. Minta Ketua Adat membuka lagi bila perlu revisi.' }
  const upd = { ...b.v }
  if (b.rab) Object.assign(upd, { rab_path: b.rab, status_rab: 'diajukan', catatan_keputusan: null, diputuskan_oleh: null, tgl_keputusan: null })
  const { error } = await adm.from('kegiatan_rab').update(upd).eq('id', id)
  if (error) return { error: pesanDb(error) }
  segar(id); return { ok: b.rab ? 'Tersimpan. RAB baru diajukan ke Ketua Adat.' : 'Perubahan disimpan.' }
}

export async function ajukanRab(fd) {
  const z = await izinAksi('pengurus'); if (z.error) return
  const id = teks(fd, 'id')
  await admin().from('kegiatan_rab').update({ status_rab: 'diajukan' }).eq('id', id).eq('status_rab', 'draft').not('rab_path', 'is', null)
  segar(id)
}

export async function putuskanRab(_p, fd) {
  const z = await izinAksi('keputusan'); if (z.error) return z
  const id = teks(fd, 'id'), setuju = fd.get('setuju') === '1', catatan = teks(fd, 'catatan')
  if (!setuju && !catatan) return { error: 'Isi alasan penolakan agar pengurus bisa merevisi.' }
  const { data, error } = await admin().from('kegiatan_rab').update({
    status_rab: setuju ? 'disetujui' : 'ditolak', catatan_keputusan: catatan, diputuskan_oleh: z.saya.id, tgl_keputusan: new Date().toISOString() })
    .eq('id', id).eq('status_rab', 'diajukan').select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'RAB ini tidak sedang menunggu keputusan.' }
  segar(id); return { ok: setuju ? 'RAB disetujui. Pengeluaran kegiatan kini bisa dicatat.' : 'RAB ditolak dan dikembalikan ke pengurus.' }
}

export async function bukaRab(fd) {          // Ketua Adat membuka RAB yang sudah disetujui untuk direvisi
  const z = await izinAksi('keputusan'); if (z.error) return
  const id = teks(fd, 'id')
  await admin().from('kegiatan_rab').update({ status_rab: 'ditolak', catatan_keputusan: 'RAB dibuka kembali untuk revisi.' }).eq('id', id).eq('status_rab', 'disetujui')
  segar(id)
}

export async function hapusKegiatan(fd) {
  const z = await izinAksi('keputusan'); if (z.error) return
  const id = teks(fd, 'id')
  const { data } = await admin().from('kegiatan_rab').delete().eq('id', id).neq('status_rab', 'disetujui').select('id')
  if (data?.length) { segar(); redirect('/kegiatan') }
}
