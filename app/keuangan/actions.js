'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, angka, pathAman, pesanDb } from '@/lib/db'
import { KATEGORI_KAS } from '@/lib/format'

export async function tambahTransaksi(_p, fd) {
  const z = await izinAksi('uang'); if (z.error) return z
  const tipe = teks(fd, 'tipe'), kategori = teks(fd, 'kategori'), tanggal = teks(fd, 'tanggal'), jumlah = angka(fd, 'jumlah')
  const kegiatan = teks(fd, 'kegiatan_id'), bukti = teks(fd, 'bukti')
  if (!['masuk', 'keluar'].includes(tipe) || !KATEGORI_KAS[kategori]) return { error: 'Jenis dan kategori wajib dipilih.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal || '') || jumlah < 1) return { error: 'Tanggal dan jumlah (minimal Rp 1) wajib diisi.' }
  if (!pathAman(bukti, 'bukti/')) return { error: 'Berkas bukti tidak valid.' }
  const adm = admin()
  if (kegiatan) {
    const { data: k } = await adm.from('kegiatan_rab').select('status_rab').eq('id', kegiatan).maybeSingle()
    if (!k) return { error: 'Kegiatan tidak ditemukan.' }
    if (tipe === 'keluar' && k.status_rab !== 'disetujui') return { error: 'Pengeluaran kegiatan hanya bisa dicatat setelah RAB disetujui Ketua Adat.' }
  } else if (tipe === 'keluar' && kategori === 'kegiatan') return { error: 'Pilih kegiatan untuk pengeluaran kategori Kegiatan.' }
  const { error } = await adm.from('buku_kas').insert({ tipe, kategori, tanggal, jumlah, keterangan: teks(fd, 'keterangan'), kegiatan_id: kegiatan, bukti_path: bukti, dibuat_oleh: z.saya.id })
  if (error) return { error: pesanDb(error) }
  revalidatePath('/keuangan'); revalidatePath('/kegiatan'); revalidatePath('/dashboard')
  return { ok: 'Transaksi dicatat.' }
}

export async function hapusTransaksi(fd) {
  const z = await izinAksi('uang'); if (z.error) return
  await admin().from('buku_kas').delete().eq('id', teks(fd, 'id')).is('kas_iuran_id', null)   // transaksi kas anggota tidak bisa dihapus
  revalidatePath('/keuangan'); revalidatePath('/kegiatan')
}
