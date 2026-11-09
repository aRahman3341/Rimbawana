import { boleh, muatIzin, izinDari } from '@/lib/auth'

export const KOLOM_PESAN = 'id,pengirim_id,jenis,isi,meet_url,meet_judul,meet_waktu,dihapus,created_at,pengirim:anggota!pengirim_id(nama_adat)'
// Link Google Meet yang sah: meet.google.com/abc-defg-hij  atau  meet.google.com/lookup/xxxx
export const MEET_RE = /^https:\/\/meet\.google\.com\/(?:[a-z]{3}-[a-z]{4}-[a-z]{3}|lookup\/[A-Za-z0-9_-]{6,})(?:\?[^\s]*)?$/
// Pesan yang dihapus tidak mengirim isinya lagi ke browser.
export const bersihPesan = (p) => p.dihapus ? { ...p, isi: null, meet_url: null, meet_judul: null, meet_waktu: null } : p

// Hak akses ruang. Akun Founder (developer tersembunyi) hanya membaca dan tidak pernah tampil sebagai anggota.
export async function aksesRuang(adm, saya, id) {
  if (!saya || !boleh(saya, 'lihat')) return null
  const { data: ruang } = await adm.from('chat_ruang').select('*').eq('id', id).maybeSingle()
  if (!ruang) return null
  const founder = saya.peran === 'founder'
  let admin = founder || (ruang.tipe === 'umum' && boleh(saya, 'chatAdmin'))
  if (ruang.tipe === 'khusus' && !founder) {
    const { data: m } = await adm.from('chat_anggota').select('admin').eq('ruang_id', id).eq('anggota_id', saya.id).maybeSingle()
    if (!m) return null
    admin = !!m.admin
  }
  return { ruang, admin, founder, bisaKirim: !founder && !ruang.arsip }
}

// Ruang yang boleh dilihat seseorang.
export async function daftarRuang(adm, saya) {
  if (!saya || !boleh(saya, 'lihat')) return []
  const { data: semua } = await adm.from('chat_ruang').select('*').order('arsip').order('created_at')
  if (saya.peran === 'founder') return semua || []
  const { data: milik } = await adm.from('chat_anggota').select('ruang_id').eq('anggota_id', saya.id)
  const ids = new Set((milik || []).map(m => m.ruang_id))
  return (semua || []).filter(r => r.tipe === 'umum' || ids.has(r.id))
}
export async function tandaiBaca(adm, saya, ruangId, terakhirId) {
  if (saya.peran === 'founder' || !terakhirId) return
  await adm.from('chat_baca').upsert({ ruang_id: ruangId, anggota_id: saya.id, terakhir_id: terakhirId })
}
// Kandidat anggota ruang: anggota aktif yang punya izin "lihat" (sesuai pengaturan Founder), tanpa akun Founder.
export async function kandidatRuang(adm) {
  const [{ data }, izin] = await Promise.all([adm.from('anggota').select('id,nama_adat,peran').eq('aktif', true).neq('peran', 'founder').order('nama_adat'), muatIzin()])
  return (data || []).filter(a => izinDari(a, izin).includes('lihat'))
}
// Apakah anggota tertentu boleh masuk ruang chat?
export async function bolehChat(adm, anggotaId) {
  const [{ data: a }, izin] = await Promise.all([adm.from('anggota').select('id,peran').eq('id', anggotaId).maybeSingle(), muatIzin()])
  return !!a && a.peran !== 'founder' && izinDari(a, izin).includes('lihat')
}
