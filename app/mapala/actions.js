'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, pesanDb } from '@/lib/db'
export async function tambahMapala(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const nama = teks(fd, 'nama'); if (!nama) return { error: 'Nama mapala wajib diisi.' }
  const { error } = await admin().from('mapala_mitra').insert({ nama, kampus: teks(fd, 'kampus'), kontak_nama: teks(fd, 'kontak_nama'), kontak_hp: teks(fd, 'kontak_hp'), alamat: teks(fd, 'alamat') })
  if (error) return { error: pesanDb(error) }
  revalidatePath('/mapala'); return { ok: 'Mapala mitra ditambahkan.' }
}
export async function hapusMapala(fd) {
  const z = await izinAksi('inventaris'); if (z.error) return
  await admin().from('mapala_mitra').delete().eq('id', teks(fd, 'id')); revalidatePath('/mapala')
}
