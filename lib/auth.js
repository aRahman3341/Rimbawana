import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Kelompok wewenang. Ubah di sini kalau pembagian tugas pengurus berubah.
export const KELOMPOK = {
  pengurus: ['founder', 'ketua_adat', 'sekretaris', 'bendahara', 'perlengkapan'],   // boleh MENGERJAKAN (menulis)
  lihat: ['founder', 'ketua_adat', 'sekretaris', 'bendahara', 'perlengkapan', 'bpr'], // boleh MELIHAT halaman pengurus (BPR hanya mengawasi)
  inventaris: ['founder', 'ketua_adat', 'sekretaris', 'perlengkapan'],             // kelola barang, peminjaman, lokasi, mapala
  lihatInv: ['founder', 'ketua_adat', 'sekretaris', 'perlengkapan', 'bpr'],
  surat: ['founder', 'ketua_adat', 'sekretaris'],                                   // arsip surat
  uang: ['founder', 'bendahara'],                                                   // buku kas, verifikasi kas
  keputusan: ['founder', 'ketua_adat'],                                             // ACC / tolak RAB
  profil: ['founder', 'ketua_adat', 'sekretaris'],                                  // ubah profil situs publik dan galeri
  arahan: ['founder', 'bpr'],                                                       // BPR memberi arahan pengawasan
  chatAdmin: ['founder', 'ketua_adat', 'sekretaris'],                               // buat dan atur ruang chat
}
export const getSaya = cache(async () => {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data } = await sb.from('anggota').select('id,nama_adat,nama_lengkap,peran,jabatan,status,aktif').eq('user_id', user.id).maybeSingle()
  return data && data.aktif ? data : null
})
export const boleh = (saya, kelompok) => !!saya && (!kelompok || KELOMPOK[kelompok].includes(saya.peran))
// Untuk halaman: wajib login (dan wajib masuk kelompok, jika disebut).
export async function wajibMasuk(kelompok) {
  const s = await getSaya()
  if (!s) redirect('/login')
  if (kelompok && !boleh(s, kelompok)) redirect('/dashboard')
  return s
}
// Untuk server action: kembalikan { saya } atau { error }.
export async function izinAksi(kelompok) {
  const saya = await getSaya()
  if (!saya) return { error: 'Sesi habis. Silakan login lagi.' }
  if (kelompok && !boleh(saya, kelompok)) return { error: 'Kamu tidak berwenang melakukan ini.' }
  return { saya }
}
