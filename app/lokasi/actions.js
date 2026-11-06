'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, pesanDb } from '@/lib/db'
export async function tambahLokasi(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const nama = teks(fd, 'nama'); if (!nama) return { error: 'Nama lokasi wajib diisi.' }
  const { error } = await admin().from('lokasi_simpan').insert({ nama, keterangan: teks(fd, 'keterangan') })
  if (error) return { error: pesanDb(error) }
  revalidatePath('/lokasi'); return { ok: 'Lokasi ditambahkan.' }
}
export async function hapusLokasi(fd) {
  const z = await izinAksi('inventaris'); if (z.error) return
  await admin().from('lokasi_simpan').delete().eq('id', teks(fd, 'id')); revalidatePath('/lokasi')
}
