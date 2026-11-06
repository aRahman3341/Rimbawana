import { createAdmin } from '@/lib/supabase/admin'
// Ambil data atau lempar error (supaya muncul di layar, bukan halaman kosong).
export function ambil({ data, error }) { if (error) throw new Error(error.message); return data }
export const admin = createAdmin
// Teks dari formulir: dirapikan, kosong -> null
export const teks = (fd, k) => String(fd.get(k) || '').trim() || null
export const angka = (fd, k) => { const n = Number(String(fd.get(k) || '').replace(/[^\d-]/g, '')); return Number.isFinite(n) ? n : 0 }
// Berkas hanya boleh berada di folder yang diharapkan (mencegah rujukan ke berkas lain).
export const pathAman = (p, awalan) => !p || (typeof p === 'string' && p.startsWith(awalan) && !p.includes('..'))
export const pesanDb = (e) => e?.code === '23505' ? 'Data dengan nama/nomor yang sama sudah ada.'
  : e?.code === '23503' ? 'Data ini masih dipakai di tempat lain.' : (e?.message || 'Terjadi kesalahan.')
