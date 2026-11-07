import { createAdmin } from '@/lib/supabase/admin'
import { IDENTITAS, SEJARAH, DIVISI_PUBLIK, KADERISASI } from '@/lib/konten'

// Data profil publik: dari database (diedit di menu Profil Situs), dengan cadangan dari lib/konten.js bila database belum siap.
export async function getProfil() {
  try {
    const adm = createAdmin()
    const [k, s, d, kd] = await Promise.all([
      adm.from('profil_konten').select('nilai').eq('kunci', 'identitas').maybeSingle(),
      adm.from('profil_sejarah').select('*').order('urut').order('created_at'),
      adm.from('profil_divisi').select('*').order('urut'),
      adm.from('profil_kaderisasi').select('*').order('urut')])
    if (s.error || d.error || kd.error) throw new Error('db')
    return {
      identitas: { ...IDENTITAS, ...(k.data?.nilai || {}) },
      sejarah: s.data.length ? s.data : SEJARAH,
      divisi: d.data.length ? d.data : DIVISI_PUBLIK,
      kaderisasi: kd.data.length ? kd.data : KADERISASI,
    }
  } catch {
    return { identitas: IDENTITAS, sejarah: SEJARAH, divisi: DIVISI_PUBLIK, kaderisasi: KADERISASI }
  }
}
export const IKON = ['tree', 'triangle', 'compass', 'backpack', 'map', 'fire', 'water', 'camera', 'people', 'book', 'heart', 'flag', 'lightning', 'globe-asia-australia']
