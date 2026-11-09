import { cache } from 'react'
import { createAdmin } from '@/lib/supabase/admin'
import { urlFoto } from '@/lib/berkas'
import { IDENTITAS, SEJARAH, DIVISI_PUBLIK, KADERISASI } from '@/lib/konten'

export const LOGO_BAWAAN = '/logo.png'
export const TAHUN_BERDIRI = 2004

// Satu kali ambil per permintaan (dipakai nav, hero, footer, login, dan metadata).
const ambilIdentitas = cache(async () => {
  const { data } = await createAdmin().from('profil_konten').select('nilai').eq('kunci', 'identitas').maybeSingle()
  return data?.nilai || {}
})
// Alamat logo: logo yang diunggah dari menu Profil Situs, atau logo bawaan.
export const getLogo = cache(async () => {
  try { return urlFoto((await ambilIdentitas()).logo_path) || LOGO_BAWAAN } catch { return LOGO_BAWAAN }
})

// Data profil publik: dari database (diedit di menu Profil Situs), dengan cadangan dari lib/konten.js bila database belum siap.
export async function getProfil() {
  try {
    const adm = createAdmin()
    const [nilai, s, d, kd] = await Promise.all([
      ambilIdentitas(),
      adm.from('profil_sejarah').select('*').order('urut').order('created_at'),
      adm.from('profil_divisi').select('*').order('urut'),
      adm.from('profil_kaderisasi').select('*').order('urut')])
    if (s.error || d.error || kd.error) throw new Error('db')
    return {
      identitas: { ...IDENTITAS, tahun_berdiri: TAHUN_BERDIRI, ...nilai },
      logo: urlFoto(nilai.logo_path) || LOGO_BAWAAN,
      sejarah: s.data.length ? s.data : SEJARAH,
      divisi: d.data.length ? d.data : DIVISI_PUBLIK,
      kaderisasi: kd.data.length ? kd.data : KADERISASI,
    }
  } catch {
    return { identitas: { ...IDENTITAS, tahun_berdiri: TAHUN_BERDIRI }, logo: LOGO_BAWAAN, sejarah: SEJARAH, divisi: DIVISI_PUBLIK, kaderisasi: KADERISASI }
  }
}
// Angkatan yang sudah diberi tahun, untuk halaman sejarah per tahun.
export async function getAngkatanPublik() {
  try {
    const { data, error } = await createAdmin().from('angkatan').select('id,nama,kode,tahun,keterangan').not('tahun', 'is', null).order('tahun').order('nama')
    if (error) throw error
    return data
  } catch { return [] }
}
export const IKON = ['tree', 'triangle', 'compass', 'backpack', 'map', 'fire', 'water', 'camera', 'people', 'book', 'heart', 'flag', 'lightning', 'globe-asia-australia']
