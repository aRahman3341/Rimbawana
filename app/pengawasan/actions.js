'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks } from '@/lib/db'

const segar = () => { revalidatePath('/pengawasan'); revalidatePath('/dashboard'); revalidatePath('/kegiatan') }

// BPR memberi arahan; tidak punya wewenang mengubah data kegiatan, barang, atau uang.
export async function buatArahan(_p, fd) {
  const z = await izinAksi('arahan'); if (z.error) return z
  const judul = teks(fd, 'judul'), isi = teks(fd, 'isi')
  if (!judul || !isi) return { error: 'Judul dan isi arahan wajib diisi.' }
  const { error } = await admin().from('arahan_bpr').insert({ judul, isi, kegiatan_id: teks(fd, 'kegiatan_id'), dibuat_oleh: z.saya.id })
  if (error) return { error: error.message }
  segar(); return { ok: 'Arahan dikirim ke pengurus.' }
}
// Pengurus menanggapi dan menandai progres.
export async function tanggapiArahan(_p, fd) {
  const z = await izinAksi('pengurus'); if (z.error) return z
  const status = ['dikerjakan', 'selesai'].includes(teks(fd, 'status')) ? teks(fd, 'status') : 'dikerjakan'
  const { error } = await admin().from('arahan_bpr').update({ status, tanggapan: teks(fd, 'tanggapan'), ditanggapi_oleh: z.saya.id }).eq('id', teks(fd, 'id'))
  if (error) return { error: error.message }
  segar(); return { ok: 'Tanggapan tersimpan.' }
}
export async function bukaLagiArahan(fd) {
  const z = await izinAksi('arahan'); if (z.error) return
  await admin().from('arahan_bpr').update({ status: 'baru' }).eq('id', teks(fd, 'id')); segar()
}
export async function hapusArahan(fd) {
  const z = await izinAksi('arahan'); if (z.error) return
  await admin().from('arahan_bpr').delete().eq('id', teks(fd, 'id')); segar()
}
