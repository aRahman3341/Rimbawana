'use server'
import { revalidatePath } from 'next/cache'
import { getSaya, izinAksi } from '@/lib/auth'
import { admin, teks, angka, pathAman } from '@/lib/db'
import { awalBulan, hariIni } from '@/lib/format'

const BULAN = /^\d{4}-\d{2}-01$/
const segar = () => { revalidatePath('/kas'); revalidatePath('/keuangan'); revalidatePath('/dashboard') }
const pesan = (e) => String(e?.message || 'Terjadi kesalahan.')

export async function bayarKas(_p, fd) {
  const saya = await getSaya(); if (!saya) return { error: 'Sesi habis. Silakan login lagi.' }
  const periode = [...new Set(fd.getAll('periode').map(String))].filter(b => BULAN.test(b)).slice(0, 12)
  const bukti = teks(fd, 'bukti')
  if (!periode.length) return { error: 'Pilih minimal satu bulan yang dibayar.' }
  if (!bukti || !pathAman(bukti, 'kas/')) return { error: 'Unggah bukti pembayaran QRIS terlebih dahulu.' }
  const { error } = await admin().rpc('rmb_kas_bayar', { p_anggota: saya.id, p_periode: periode, p_metode: 'qris', p_bukti: bukti, p_actor: saya.id, p_langsung: false })
  if (error) return { error: pesan(error) }
  segar(); return { ok: 'Pembayaran terkirim. Menunggu verifikasi bendahara.' }
}

export async function catatTunai(_p, fd) {
  const z = await izinAksi('uang'); if (z.error) return z
  const bulan = (teks(fd, 'bulan') || '') + '-01', anggota = teks(fd, 'anggota_id')
  if (!anggota || !BULAN.test(bulan)) return { error: 'Pilih anggota dan bulan.' }
  const { error } = await admin().rpc('rmb_kas_bayar', { p_anggota: anggota, p_periode: [bulan], p_metode: 'tunai', p_bukti: null, p_actor: z.saya.id, p_langsung: true })
  if (error) return { error: pesan(error) }
  segar(); return { ok: 'Kas tunai dicatat dan masuk ke buku kas.' }
}

export async function verifikasiKas(fd) {
  const z = await izinAksi('uang'); if (z.error) return
  await admin().rpc('rmb_kas_verifikasi', { p_id: teks(fd, 'id'), p_actor: z.saya.id, p_setuju: fd.get('setuju') === '1', p_catatan: fd.get('setuju') === '1' ? null : 'Ditolak bendahara' })
  segar()
}

export async function simpanPengaturanKas(_p, fd) {
  const z = await izinAksi('uang'); if (z.error) return z
  const nominal = angka(fd, 'nominal'), mulai = teks(fd, 'mulai'), qris = teks(fd, 'qris')
  if (nominal < 1000) return { error: 'Nominal kas minimal Rp 1.000.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mulai || '')) return { error: 'Tanggal mulai kas tidak valid.' }
  if (!pathAman(qris, 'qris/')) return { error: 'Berkas QRIS tidak valid.' }
  const baris = [{ kunci: 'kas_nominal', nilai: String(nominal) }, { kunci: 'kas_mulai', nilai: awalBulan(mulai) }]
  if (qris) baris.push({ kunci: 'qris_path', nilai: qris })
  const { error } = await admin().from('rmb_pengaturan').upsert(baris)
  if (error) return { error: error.message }
  segar(); return { ok: 'Pengaturan kas disimpan.' }
}
