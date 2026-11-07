import { createAdmin } from '@/lib/supabase/admin'
import { cekDrive } from '@/lib/drive'

export const MAKS_UNGGAH_MB = 50      // batas paket gratis Supabase Storage per file
export const MAKS_TOTAL_MB = 100      // batas keseluruhan (file 50-100 MB lewat Google Drive)

// Tautan sementara (1 jam) untuk berkas privat di bucket "arsip". Hasil: { [path]: url }
export async function urlArsip(paths) {
  const unik = [...new Set((paths || []).filter(Boolean))]
  if (!unik.length) return {}
  const { data } = await createAdmin().storage.from('arsip').createSignedUrls(unik, 3600)
  const peta = {}
  ;(data || []).forEach(d => { if (d.signedUrl) peta[d.path] = d.signedUrl })
  return peta
}
export const urlFoto = (path) => path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/foto/${path}` : null
// Tautan buka sebuah berkas: link Drive langsung, atau tautan sementara Storage.
export const tautanBerkas = (url, path, peta) => url || (path ? peta[path] : null) || null

// Membaca isian berkas dari formulir: salah satu path Storage (nama) atau link Drive (nama_drive).
// File TIDAK pernah masuk database; yang disimpan hanya path/link + nama + ukuran, setelah dipastikan filenya ada.
export async function bacaBerkas(fd, nama, awalan, { bucket = 'arsip', izinFolder = false } = {}) {
  const path = String(fd.get(nama) || '').trim(), drive = String(fd.get(`${nama}_drive`) || '').trim()
  if (path && drive) return { error: 'Pilih salah satu: unggah file atau link Google Drive.' }
  if (path) {
    if (!path.startsWith(awalan) || path.includes('..')) return { error: 'Berkas tidak valid.' }
    const dir = path.slice(0, path.lastIndexOf('/')), nm = path.slice(path.lastIndexOf('/') + 1)
    const { data, error } = await createAdmin().storage.from(bucket).list(dir, { search: nm, limit: 5 })
    const f = (data || []).find(x => x.name === nm)
    if (error || !f) return { error: 'Berkas belum selesai terunggah. Tunggu tulisan "Terunggah", lalu simpan.' }
    const ukuran = f.metadata?.size ?? null
    if (ukuran && ukuran > MAKS_TOTAL_MB * 1048576) return { error: `Berkas melebihi ${MAKS_TOTAL_MB} MB.` }
    return { path, nama: nm, ukuran }
  }
  if (drive) {
    const r = await cekDrive(drive, { maksMB: MAKS_TOTAL_MB, izinFolder })
    return r.error ? { error: r.error } : { url: r.link, nama: r.nama, ukuran: r.ukuran, drive_id: r.id }
  }
  return {}
}
// Gambar mini untuk media Drive (hanya berfungsi untuk file yang dibagikan "siapa saja dengan link").
export const mini = (m, lebar = 480) => m.foto_path ? urlFoto(m.foto_path) : (m.drive_id && m.jenis !== 'album' ? `https://drive.google.com/thumbnail?id=${m.drive_id}&sz=w${lebar}` : null)
