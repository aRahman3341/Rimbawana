'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, pathAman, pesanDb } from '@/lib/db'
import { KATEGORI_SURAT } from '@/lib/format'

export async function simpanSurat(_p, fd) {
  const z = await izinAksi('surat'); if (z.error) return z
  const arah = teks(fd, 'arah'), kategori = teks(fd, 'kategori'), tanggal = teks(fd, 'tanggal'), perihal = teks(fd, 'perihal')
  const nomor = teks(fd, 'nomor'), file = teks(fd, 'file'), kegiatan = teks(fd, 'kegiatan_id')
  if (!['keluar', 'masuk'].includes(arah) || !KATEGORI_SURAT[kategori]) return { error: 'Arah dan jenis surat wajib dipilih.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal || '') || !perihal) return { error: 'Tanggal dan perihal wajib diisi.' }
  if (!pathAman(file, 'surat/')) return { error: 'Berkas tidak valid.' }
  if (arah === 'masuk' && !nomor) return { error: 'Nomor surat masuk wajib diisi (sesuai surat dari pengirim).' }
  const adm = admin(), pihak = teks(fd, 'pihak'), ringkasan = teks(fd, 'ringkasan')
  let hasil
  if (arah === 'keluar' && !nomor) {
    hasil = await adm.rpc('rmb_buat_surat_keluar', { p_kategori: kategori, p_tanggal: tanggal, p_perihal: perihal, p_pihak: pihak, p_ringkasan: ringkasan, p_file: file, p_actor: z.saya.id, p_kegiatan: kegiatan, p_pinjam: null })
  } else {
    hasil = await adm.from('surat_arsip').insert({ arah, kategori, nomor, tanggal, perihal, pihak, ringkasan, file_path: file, kegiatan_id: kegiatan, dibuat_oleh: z.saya.id }).select('nomor').single()
  }
  if (hasil.error) return { error: hasil.error.code === '23505' ? 'Nomor surat itu sudah ada di arsip.' : pesanDb(hasil.error) }
  revalidatePath('/surat')
  return { ok: `Surat tersimpan dengan nomor ${hasil.data.nomor}.` }
}

export async function pasangBerkas(_p, fd) {
  const z = await izinAksi('surat'); if (z.error) return z
  const id = teks(fd, 'id'), file = teks(fd, 'file')
  if (!file || !pathAman(file, 'surat/')) return { error: 'Pilih berkas PDF terlebih dahulu.' }
  const { error } = await admin().from('surat_arsip').update({ file_path: file }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/surat'); return { ok: 'Berkas dipasang.' }
}

export async function hapusSurat(fd) {
  const z = await izinAksi('surat'); if (z.error) return
  const adm = admin(), id = teks(fd, 'id')
  const { data: s } = await adm.from('surat_arsip').select('file_path').eq('id', id).maybeSingle()
  await adm.from('surat_arsip').delete().eq('id', id)
  if (s?.file_path) await adm.storage.from('arsip').remove([s.file_path])
  revalidatePath('/surat')
}
