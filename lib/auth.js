import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// IZIN. Founder (akun developer tersembunyi) memiliki SEMUA izin dan mengatur siapa memegang izin apa
// lewat menu "Akses & CS Founder". Kunci izin di bawah dipakai di seluruh kode: boleh(saya, 'surat').
// ---------------------------------------------------------------------------
export const DAFTAR_IZIN = [
  { kunci: 'lihat', judul: 'Melihat halaman pengurus', ket: 'Arsip surat, buku kas, RAB, kas anggota, chat pengurus, pengawasan, galeri, data angkatan (hanya lihat).' },
  { kunci: 'lihatInv', judul: 'Melihat peminjaman alat', ket: 'Daftar dan detail peminjaman (hanya lihat).' },
  { kunci: 'pengurus', judul: 'Mengerjakan tugas pengurus', ket: 'Mengajukan kegiatan dan RAB, menanggapi arahan BPR.' },
  { kunci: 'inventaris', judul: 'Kelola barang dan peminjaman', ket: 'Tambah/ubah barang, serahkan dan terima alat, lokasi simpan, mapala mitra, impor Excel.' },
  { kunci: 'surat', judul: 'Kelola arsip surat', ket: 'Arsipkan surat, nomor surat otomatis, unggah berkas.' },
  { kunci: 'uang', judul: 'Kelola uang kas', ket: 'Verifikasi kas anggota, catat transaksi buku kas, pengaturan kas dan QRIS.' },
  { kunci: 'keputusan', judul: 'ACC atau tolak RAB', ket: 'Memutuskan RAB kegiatan.' },
  { kunci: 'profil', judul: 'Ubah situs publik', ket: 'Profil situs, logo, galeri media, data angkatan.' },
  { kunci: 'arahan', judul: 'Memberi arahan pengawasan', ket: 'Menulis arahan di menu Pengawasan BPR.' },
  { kunci: 'chatAdmin', judul: 'Buat dan atur ruang chat', ket: 'Membuat ruang chat dan mengatur anggotanya.' },
]
export const KUNCI_IZIN = DAFTAR_IZIN.map(i => i.kunci)
export const judulIzin = (k) => DAFTAR_IZIN.find(i => i.kunci === k)?.judul || k
// Peran yang izinnya bisa diatur (Founder tidak ada di sini: selalu penuh dan tersembunyi).
export const PERAN_ATUR = ['ketua_adat', 'sekretaris', 'bendahara', 'perlengkapan', 'bpr', 'anggota']

// Pembagian BAWAAN. Dipakai sebagai cadangan jika tabel akses_role belum ada / masih kosong
// (mis. sebelum 07_akses_cs_founder.sql dijalankan). Sama dengan isi awal tabel itu.
export const KELOMPOK = {
  pengurus: ['founder', 'ketua_adat', 'sekretaris', 'bendahara', 'perlengkapan'],
  lihat: ['founder', 'ketua_adat', 'sekretaris', 'bendahara', 'perlengkapan', 'bpr'],
  inventaris: ['founder', 'ketua_adat', 'sekretaris', 'perlengkapan'],
  lihatInv: ['founder', 'ketua_adat', 'sekretaris', 'perlengkapan', 'bpr'],
  surat: ['founder', 'ketua_adat', 'sekretaris'],
  uang: ['founder', 'bendahara'],
  keputusan: ['founder', 'ketua_adat'],
  profil: ['founder', 'ketua_adat', 'sekretaris'],
  arahan: ['founder', 'bpr'],
  chatAdmin: ['founder', 'ketua_adat', 'sekretaris'],
}

// Pengaturan izin dari database: { peran: {izin: Set(peran)}, orang: {anggotaId: Set(izin)} }. Satu kali per permintaan.
export const muatIzin = cache(async () => {
  const bawaan = () => ({ peran: Object.fromEntries(Object.entries(KELOMPOK).map(([k, v]) => [k, new Set(v)])), orang: {}, dariDb: false })
  try {
    const adm = createAdmin()
    const [r, u] = await Promise.all([adm.from('akses_role').select('role,izin'), adm.from('akses_pengguna').select('anggota_id,izin')])
    if (r.error || u.error || !r.data.length) return bawaan()
    const peran = {}, orang = {}
    r.data.forEach(x => { (peran[x.izin] ||= new Set()).add(x.role) })
    u.data.forEach(x => { (orang[x.anggota_id] ||= new Set()).add(x.izin) })
    return { peran, orang, dariDb: true }
  } catch { return bawaan() }
})

// Daftar izin efektif seorang anggota = izin peran + izin tambahan pribadi.
export function izinDari(a, data) {
  if (a.peran === 'founder') return [...KUNCI_IZIN, 'founder']
  return KUNCI_IZIN.filter(k => data.peran[k]?.has(a.peran) || data.orang[a.id]?.has(k))
}

export const getSaya = cache(async () => {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data } = await sb.from('anggota').select('id,nama_adat,nama_lengkap,peran,jabatan,status,aktif').eq('user_id', user.id).maybeSingle()
  if (!data || !data.aktif) return null
  return { ...data, izin: izinDari(data, await muatIzin()) }
})
export const boleh = (saya, izin) => !!saya && (!izin || saya.izin.includes(izin))

// Untuk halaman: wajib login (dan wajib punya izin, jika disebut). Tanpa izin -> diarahkan ke CS Founder untuk minta akses.
export async function wajibMasuk(izin) {
  const s = await getSaya()
  if (!s) redirect('/login')
  if (izin && !boleh(s, izin)) redirect(`/bantuan?izin=${encodeURIComponent(izin)}`)
  return s
}
// Halaman khusus Founder; bagi yang lain halaman ini seolah tidak ada.
export async function wajibFounder() {
  const s = await getSaya()
  if (!s) redirect('/login')
  if (s.peran !== 'founder') redirect('/dashboard')
  return s
}
// Untuk server action: kembalikan { saya } atau { error }.
export async function izinAksi(izin) {
  const saya = await getSaya()
  if (!saya) return { error: 'Sesi habis. Silakan login lagi.' }
  if (izin && !boleh(saya, izin)) return { error: 'Kamu tidak berwenang melakukan ini.' }
  return { saya }
}
export async function izinFounder() {
  const saya = await getSaya()
  return saya?.peran === 'founder' ? { saya } : { error: 'Kamu tidak berwenang melakukan ini.' }
}
