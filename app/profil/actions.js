'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, angka, pesanDb } from '@/lib/db'
import { IKON } from '@/lib/profil'

const segar = () => { revalidatePath('/'); revalidatePath('/tentang'); revalidatePath('/profil') }
const idBaru = (fd) => teks(fd, 'id')

export async function simpanIdentitas(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const v = (k) => String(fd.get(k) || '').trim()
  if (!v('nama') || !v('lengkap')) return { error: 'Nama dan nama lengkap wajib diisi.' }
  const sosial = v('sosial').split('\n').map(l => l.split('|').map(x => x.trim())).filter(a => a.length >= 3 && /^https?:\/\//i.test(a[2]))
    .map(([nama, ikon, url]) => ({ nama, ikon: ikon.toLowerCase().replace(/[^a-z0-9-]/g, ''), url })).slice(0, 8)
  const nilai = { nama: v('nama'), lengkap: v('lengkap'), kampus: v('kampus'), alamat: v('alamat'), email: v('email'), tagline: v('tagline'), sosial }
  const { error } = await admin().from('profil_konten').upsert({ kunci: 'identitas', nilai, updated_at: new Date().toISOString() })
  if (error) return { error: pesanDb(error) }
  segar(); return { ok: 'Identitas disimpan. Halaman publik diperbarui.' }
}

async function simpanBaris(tabel, id, nilai) {
  const adm = admin()
  const { error } = id ? await adm.from(tabel).update(nilai).eq('id', id) : await adm.from(tabel).insert(nilai)
  return error ? { error: pesanDb(error) } : (segar(), { ok: 'Tersimpan.' })
}
const hapus = async (tabel, fd) => { const z = await izinAksi('profil'); if (z.error) return; await admin().from(tabel).delete().eq('id', teks(fd, 'id')); segar() }

export async function simpanSejarah(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const isi = teks(fd, 'isi'); if (!isi) return { error: 'Isi cerita wajib diisi.' }
  return simpanBaris('profil_sejarah', idBaru(fd), { tahun: teks(fd, 'tahun'), judul: teks(fd, 'judul'), isi, urut: angka(fd, 'urut') })
}
export const hapusSejarah = (fd) => hapus('profil_sejarah', fd)

export async function simpanDivisi(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const nama = teks(fd, 'nama'); if (!nama) return { error: 'Nama divisi wajib diisi.' }
  const ikon = IKON.includes(teks(fd, 'ikon')) ? teks(fd, 'ikon') : 'compass'
  return simpanBaris('profil_divisi', idBaru(fd), { nama, kode: teks(fd, 'kode'), ikon, isi: teks(fd, 'isi'), urut: angka(fd, 'urut') })
}
export const hapusDivisi = (fd) => hapus('profil_divisi', fd)

export async function simpanKaderisasi(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const tahap = teks(fd, 'tahap'); if (!tahap) return { error: 'Nama tahap wajib diisi.' }
  const sub = String(fd.get('sub') || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 8)
  return simpanBaris('profil_kaderisasi', idBaru(fd), { tahap, isi: teks(fd, 'isi'), sub, urut: angka(fd, 'urut') })
}
export const hapusKaderisasi = (fd) => hapus('profil_kaderisasi', fd)
