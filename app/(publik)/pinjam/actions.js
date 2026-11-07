'use server'
import { admin, teks } from '@/lib/db'
import { hariIni, tambahHari } from '@/lib/format'

export async function ajukanPinjam(_prev, fd) {
  if (fd.get('website')) return { ok: 'Permintaan terkirim.' }              // jebakan bot (kolom tersembunyi)
  const nama = teks(fd, 'nama'), hp = (teks(fd, 'hp') || '').replace(/[^\d+]/g, '')
  const tglP = teks(fd, 'tgl_pinjam'), tglK = teks(fd, 'tgl_kembali'), keperluan = teks(fd, 'keperluan')
  if (!nama || !keperluan) return { error: 'Nama dan keperluan wajib diisi.' }
  if (hp.replace(/\D/g, '').length < 9) return { error: 'Nomor WhatsApp tidak valid.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tglP || '') || !/^\d{4}-\d{2}-\d{2}$/.test(tglK || '')) return { error: 'Tanggal tidak valid.' }
  if (tglP < hariIni()) return { error: 'Tanggal pinjam tidak boleh di masa lalu.' }
  if (tglK < tglP) return { error: 'Tanggal kembali harus setelah tanggal pinjam.' }
  if (tglK > tambahHari(60)) return { error: 'Peminjaman maksimal 60 hari dari hari ini.' }

  let items = []
  try { items = JSON.parse(String(fd.get('items') || '[]')) } catch { items = [] }
  const gabung = new Map()
  for (const it of items.slice(0, 20)) {
    const n = Math.floor(Number(it.jumlah))
    if (typeof it.jenis_id !== 'string' || !(n > 0 && n <= 100)) continue
    gabung.set(it.jenis_id, (gabung.get(it.jenis_id) || 0) + n)
  }
  if (!gabung.size) return { error: 'Pilih minimal satu alat.' }

  const adm = admin()
  const { data: stok, error: e1 } = await adm.from('v_stok_jenis').select('id,nama,bebas,sembunyikan').in('id', [...gabung.keys()])
  if (e1) return { error: e1.message }
  for (const [id, n] of gabung) {
    const s = stok.find(x => x.id === id)
    if (!s) return { error: 'Ada alat yang tidak dikenal. Muat ulang halaman.' }
    if (s.sembunyikan || s.bebas < n) return { error: s.bebas > 0 && !s.sembunyikan ? `Stok ${s.nama} hanya tersedia ${s.bebas}.` : `${s.nama} sedang tidak tersedia.` }
  }
  const { count } = await adm.from('pinjam').select('id', { count: 'exact', head: true }).eq('peminjam_hp', hp).eq('status', 'menunggu')
  if ((count || 0) >= 3) return { error: 'Kamu masih punya 3 permintaan yang belum diproses. Tunggu pengurus menghubungi.' }

  const { data: p, error } = await adm.from('pinjam').insert({
    tipe: 'anggota', peminjam_nama: nama, peminjam_adat: teks(fd, 'adat'), peminjam_hp: hp,
    keperluan, tgl_pinjam: tglP, tgl_rencana_kembali: tglK }).select('id,kode').single()
  if (error) return { error: error.message }
  const { error: e2 } = await adm.from('pinjam_item').insert([...gabung].map(([jenis_id, jumlah]) => ({ pinjam_id: p.id, jenis_id, jumlah })))
  if (e2) { await adm.from('pinjam').delete().eq('id', p.id); return { error: e2.message } }
  return { ok: `Permintaan terkirim. Kode: ${p.kode}. Simpan kode ini; pengurus akan menghubungi WhatsApp kamu.` }
}
