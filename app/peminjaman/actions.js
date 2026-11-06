'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks } from '@/lib/db'
import { hariIni } from '@/lib/format'

const TGL = /^\d{4}-\d{2}-\d{2}$/
const segar = (id) => { revalidatePath('/peminjaman'); revalidatePath(`/peminjaman/${id}`); revalidatePath('/barang'); revalidatePath('/dashboard'); revalidatePath('/surat') }
const pesan = (e) => String(e?.message || 'Terjadi kesalahan.').replace(/^.*?(Stok|Peminjaman|Hanya|Sebagian)/, '$1')

export async function catatPinjam(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const tipe = teks(fd, 'tipe'), mapala_id = teks(fd, 'mapala_id')
  if (!['anggota', 'mapala_pinjam', 'kita_pinjam'].includes(tipe)) return { error: 'Jenis peminjaman tidak valid.' }
  if (tipe !== 'anggota' && !mapala_id) return { error: 'Pilih mapala mitra (tambahkan dulu di menu Mapala Mitra).' }
  if (tipe === 'anggota' && !teks(fd, 'nama')) return { error: 'Nama peminjam wajib diisi.' }
  const tglP = teks(fd, 'tgl_pinjam'), tglK = teks(fd, 'tgl_kembali')
  if (!TGL.test(tglP || '') || !TGL.test(tglK || '')) return { error: 'Tanggal tidak valid.' }
  if (tglK < tglP) return { error: 'Tanggal kembali harus setelah tanggal pinjam.' }
  let items = []; try { items = JSON.parse(String(fd.get('items') || '[]')) } catch {}
  const gabung = new Map()
  for (const it of items.slice(0, 30)) { const n = Math.floor(Number(it.jumlah)); if (typeof it.jenis_id === 'string' && n > 0 && n <= 200) gabung.set(it.jenis_id, (gabung.get(it.jenis_id) || 0) + n) }
  if (!gabung.size) return { error: 'Pilih minimal satu barang.' }

  const adm = admin()
  const { data: p, error } = await adm.from('pinjam').insert({
    tipe, mapala_id: tipe === 'anggota' ? null : mapala_id, peminjam_nama: teks(fd, 'nama'), peminjam_adat: teks(fd, 'adat'), peminjam_hp: teks(fd, 'hp'),
    keperluan: teks(fd, 'keperluan'), tgl_pinjam: tglP, tgl_rencana_kembali: tglK, catatan: teks(fd, 'catatan') }).select('id,kode').single()
  if (error) return { error: error.message }
  const { error: e2 } = await adm.from('pinjam_item').insert([...gabung].map(([jenis_id, jumlah]) => ({ pinjam_id: p.id, jenis_id, jumlah })))
  if (e2) { await adm.from('pinjam').delete().eq('id', p.id); return { error: e2.message } }
  if (fd.get('langsung') === 'on') {
    const { error: e3 } = await adm.rpc('rmb_pinjam_serahkan', { p_id: p.id, p_actor: z.saya.id })
    if (e3) { await adm.from('pinjam').delete().eq('id', p.id); return { error: pesan(e3) } }
  }
  if (fd.get('buat_surat') === 'on' && tipe !== 'anggota') {
    const { data: m } = await adm.from('mapala_mitra').select('nama').eq('id', mapala_id).maybeSingle()
    await adm.rpc('rmb_buat_surat_keluar', { p_kategori: 'peminjaman', p_tanggal: hariIni(), p_perihal: `${tipe === 'kita_pinjam' ? 'Permohonan peminjaman alat ke' : 'Peminjaman alat oleh'} ${m?.nama || 'mapala mitra'} (${p.kode})`,
      p_pihak: m?.nama || null, p_ringkasan: null, p_file: null, p_actor: z.saya.id, p_kegiatan: null, p_pinjam: p.id })
  }
  segar(p.id); redirect(`/peminjaman/${p.id}`)
}

export async function serahkanAksi(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const id = teks(fd, 'id')
  const { error } = await admin().rpc('rmb_pinjam_serahkan', { p_id: id, p_actor: z.saya.id })
  if (error) return { error: pesan(error) }
  segar(id); return { ok: 'Alat diserahkan. Status unit diperbarui otomatis.' }
}

export async function tolakAksi(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const id = teks(fd, 'id')
  const { error } = await admin().rpc('rmb_pinjam_tolak', { p_id: id, p_actor: z.saya.id, p_catatan: teks(fd, 'catatan') })
  if (error) return { error: pesan(error) }
  segar(id); return { ok: 'Permintaan ditolak.' }
}

export async function kembaliAksi(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const id = teks(fd, 'id'), kondisi = {}
  for (const [k, v] of fd.entries()) if (k.startsWith('k_')) kondisi[k.slice(2)] = String(v)
  const { error } = await admin().rpc('rmb_pinjam_kembali', { p_id: id, p_actor: z.saya.id, p_kondisi: kondisi })
  if (error) return { error: pesan(error) }
  segar(id); return { ok: 'Pengembalian tercatat. Unit kembali tersedia.' }
}
