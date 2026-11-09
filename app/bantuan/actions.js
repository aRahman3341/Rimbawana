'use server'
import { revalidatePath } from 'next/cache'
import { getSaya, KUNCI_IZIN } from '@/lib/auth'
import { admin, teks } from '@/lib/db'

// Permintaan akses / bantuan ke CS Founder. Identitas Founder tidak pernah ditampilkan ke pengirim.
export async function ajukanAkses(_p, fd) {
  const saya = await getSaya()
  if (!saya) return { error: 'Sesi habis. Silakan login lagi.' }
  if (saya.peran === 'founder') return { error: 'Tidak tersedia.' }
  const izin = teks(fd, 'izin'), pesan = teks(fd, 'pesan')
  if (izin && !KUNCI_IZIN.includes(izin)) return { error: 'Izin tidak dikenal.' }
  if (izin && saya.izin.includes(izin)) return { error: 'Kamu sudah memiliki izin ini.' }
  if (!pesan || pesan.length < 5) return { error: 'Tulis alasan atau keperluanmu (minimal 5 huruf).' }
  const adm = admin()
  const { count } = await adm.from('akses_permintaan').select('id', { count: 'exact', head: true }).eq('anggota_id', saya.id).eq('status', 'baru')
  if ((count || 0) >= 3) return { error: 'Kamu masih punya 3 permintaan yang belum dijawab. Tunggu dulu ya.' }
  const { error } = await adm.from('akses_permintaan').insert({ anggota_id: saya.id, izin, pesan: pesan.slice(0, 500) })
  if (error) return { error: /akses_permintaan/.test(error.message) ? 'Fitur ini belum diaktifkan (SQL 07 belum dijalankan).' : error.message }
  revalidatePath('/bantuan'); revalidatePath('/akses'); revalidatePath('/dashboard')
  return { ok: 'Permintaan terkirim ke CS Founder. Jawabannya muncul di halaman ini.' }
}
