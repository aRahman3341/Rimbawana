// Pembantu inventaris (dipakai beberapa server action).
export const nomorUnit = (divisi, urut, n) => `${divisi}-${String(urut).padStart(2, '0')}-${String(n).padStart(3, '0')}`

// Tambah `jumlah` unit untuk sebuah jenis; nomor dilanjutkan otomatis dan tidak pernah bentrok.
export async function tambahUnit(adm, jenis, jumlah, dasar = {}) {
  if (!(jumlah > 0)) return 0
  const { data: ada, error: e0 } = await adm.from('barang_unit').select('nomor').eq('jenis_id', jenis.id)
  if (e0) throw new Error(e0.message)
  const pakai = new Set((ada || []).map(x => x.nomor))
  const baris = []
  let n = pakai.size
  while (baris.length < jumlah) {
    n++
    const nomor = nomorUnit(jenis.divisi, jenis.urut, n)
    if (!pakai.has(nomor)) { pakai.add(nomor); baris.push({ jenis_id: jenis.id, nomor, ...dasar }) }
  }
  const { error } = await adm.from('barang_unit').insert(baris)
  if (error) throw new Error(error.message)
  return baris.length
}
export async function urutBerikut(adm, divisi) {
  const { data } = await adm.from('barang_jenis').select('urut').eq('divisi', divisi).order('urut', { ascending: false }).limit(1)
  return (data?.[0]?.urut || 0) + 1
}
