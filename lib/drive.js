// Pembantu Google Drive: mengurai link, memastikan file ADA dan ukurannya <= batas.
// Database hanya menyimpan link + nama + ukuran. File aslinya tetap di Drive.
const POLA = [
  { re: /drive\.google\.com\/file\/d\/([\w-]{10,})/, folder: false },
  { re: /drive\.google\.com\/(?:open|uc)\?(?:[^#\s]*&)?id=([\w-]{10,})/, folder: false },
  { re: /drive\.google\.com\/(?:drive\/)?(?:u\/\d+\/)?folders\/([\w-]{10,})/, folder: true },
  { re: /docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([\w-]{10,})/, folder: false },
]
export function parseDrive(url) {
  const u = String(url || '').trim()
  if (!/^https:\/\//i.test(u)) return null
  for (const p of POLA) {
    const m = p.re.exec(u)
    if (m) return { id: m[1], folder: p.folder, link: p.folder ? `https://drive.google.com/drive/folders/${m[1]}` : `https://drive.google.com/file/d/${m[1]}/view` }
  }
  return null
}
const MB = 1024 * 1024
const TIDAK_ADA = 'File tidak ditemukan atau belum dibagikan. Di Google Drive: Bagikan > Akses umum > "Siapa saja yang memiliki link" (Pelihat).'

export async function cekDrive(url, { maksMB = 100, izinFolder = false } = {}) {
  const p = parseDrive(url)
  if (!p) return { error: 'Link bukan link Google Drive yang valid (harus diawali https://drive.google.com/...).' }
  if (p.folder && !izinFolder) return { error: 'Tempel link FILE, bukan link folder.' }
  const key = process.env.GOOGLE_API_KEY
  try {
    if (key) {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${p.id}?fields=id,name,mimeType,size,trashed&supportsAllDrives=true&key=${key}`,
        { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if ([401, 403, 404].includes(r.status)) return { error: TIDAK_ADA }
      if (!r.ok) return { error: `Google Drive menolak permintaan (kode ${r.status}). Periksa GOOGLE_API_KEY.` }
      const j = await r.json()
      if (j.trashed) return { error: 'File ini ada di tempat sampah Drive.' }
      const folder = j.mimeType === 'application/vnd.google-apps.folder'
      if (folder && !izinFolder) return { error: 'Tempel link FILE, bukan link folder.' }
      const ukuran = j.size ? Number(j.size) : null
      if (ukuran && ukuran > maksMB * MB) return { error: `Ukuran file ${(ukuran / MB).toFixed(1)} MB melebihi batas ${maksMB} MB.` }
      return { ok: true, id: p.id, link: p.link, nama: j.name, ukuran, folder, ukuranTerverifikasi: ukuran !== null || folder }
    }
    // Tanpa GOOGLE_API_KEY: hanya memastikan halaman publiknya terbuka (ukuran tidak bisa diperiksa).
    const r = await fetch(p.link, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (r.status === 404 || (r.status >= 300 && r.status < 400)) return { error: TIDAK_ADA }
    if (!r.ok) return { error: `Google Drive tidak bisa dibuka (kode ${r.status}).` }
    return { ok: true, id: p.id, link: p.link, nama: null, ukuran: null, folder: p.folder, ukuranTerverifikasi: false }
  } catch {
    return { error: 'Tidak bisa menghubungi Google Drive. Coba lagi sebentar lagi.' }
  }
}
