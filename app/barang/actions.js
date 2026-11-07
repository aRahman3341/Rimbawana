'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks, angka, pathAman, pesanDb } from '@/lib/db'
import { tambahUnit, urutBerikut } from '@/lib/barang'
import { DIVISI } from '@/lib/format'

const MAKS_UNIT = 300
const kondisiOk = (k) => (k === 'tidak_layak' ? 'tidak_layak' : 'layak')
const hargaOpsional = (fd) => { const h = angka(fd, 'harga'); return h > 0 ? h : null }

export async function tambahJenis(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const divisi = teks(fd, 'divisi'), nama = teks(fd, 'nama'), foto = teks(fd, 'foto')
  if (!DIVISI[divisi] || !nama) return { error: 'Divisi dan nama barang wajib diisi.' }
  if (!pathAman(foto, 'barang/')) return { error: 'Berkas foto tidak valid.' }
  const jumlah = Math.min(Math.max(angka(fd, 'jumlah'), 0), MAKS_UNIT)
  const adm = admin()
  const urut = await urutBerikut(adm, divisi)
  const { data: j, error } = await adm.from('barang_jenis').insert({
    divisi, nama, satuan: teks(fd, 'satuan') || 'buah', keterangan: teks(fd, 'keterangan'), foto_path: foto, urut }).select().single()
  if (error) return { error: error.code === '23505' ? 'Barang dengan nama itu sudah ada di divisi tersebut.' : pesanDb(error) }
  try {
    await tambahUnit(adm, j, jumlah, { lokasi_id: teks(fd, 'lokasi_id'), kondisi: kondisiOk(teks(fd, 'kondisi')), harga: hargaOpsional(fd) })
  } catch (e) { return { error: 'Jenis tersimpan, tetapi unit gagal dibuat: ' + e.message } }
  revalidatePath('/barang')
  return { ok: `${nama} ditambahkan dengan ${jumlah} unit.` }
}

export async function ubahJenis(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const id = teks(fd, 'id'), nama = teks(fd, 'nama'), foto = teks(fd, 'foto')
  if (!id || !nama) return { error: 'Nama barang wajib diisi.' }
  if (!pathAman(foto, 'barang/')) return { error: 'Berkas foto tidak valid.' }
  const upd = { nama, satuan: teks(fd, 'satuan') || 'buah', keterangan: teks(fd, 'keterangan'), sembunyikan: fd.get('sembunyikan') === 'on' }
  if (DIVISI[teks(fd, 'divisi')]) upd.divisi = teks(fd, 'divisi')
  if (foto) upd.foto_path = foto
  const { error } = await admin().from('barang_jenis').update(upd).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'Nama itu sudah dipakai barang lain di divisi tersebut.' : pesanDb(error) }
  revalidatePath('/barang'); revalidatePath(`/barang/${id}`)
  return { ok: 'Perubahan disimpan.' }
}

export async function hapusJenis(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const id = teks(fd, 'id'); const adm = admin()
  const { count } = await adm.from('barang_unit').select('id', { count: 'exact', head: true }).eq('jenis_id', id).eq('status', 'dipinjam')
  if (count) return { error: 'Masih ada unit yang sedang dipinjam.' }
  const { error } = await adm.from('barang_jenis').delete().eq('id', id)
  if (error) return { error: error.code === '23503' ? 'Barang ini pernah dipakai di peminjaman, jadi tidak bisa dihapus. Nonaktifkan unitnya saja.' : error.message }
  revalidatePath('/barang'); redirect('/barang')
}

export async function tambahUnitAksi(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const jumlah = Math.min(angka(fd, 'jumlah'), MAKS_UNIT)
  if (jumlah < 1) return { error: 'Jumlah minimal 1.' }
  const adm = admin()
  const { data: j } = await adm.from('barang_jenis').select('*').eq('id', teks(fd, 'jenis_id')).maybeSingle()
  if (!j) return { error: 'Barang tidak ditemukan.' }
  try {
    await tambahUnit(adm, j, jumlah, { lokasi_id: teks(fd, 'lokasi_id'), kondisi: kondisiOk(teks(fd, 'kondisi')), harga: hargaOpsional(fd), keterangan: teks(fd, 'keterangan') })
  } catch (e) { return { error: e.message } }
  revalidatePath(`/barang/${j.id}`); revalidatePath('/barang')
  return { ok: `${jumlah} unit ditambahkan.` }
}

export async function ubahUnit(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const adm = admin(), id = teks(fd, 'id')
  const { data: u } = await adm.from('barang_unit').select('id,jenis_id,status').eq('id', id).maybeSingle()
  if (!u) return { error: 'Unit tidak ditemukan.' }
  const upd = { lokasi_id: teks(fd, 'lokasi_id'), kondisi: kondisiOk(teks(fd, 'kondisi')), harga: hargaOpsional(fd),
    tahun_beli: angka(fd, 'tahun_beli') || null, keterangan: teks(fd, 'keterangan') }
  const st = teks(fd, 'status')
  if (u.status !== 'dipinjam' && (st === 'tersedia' || st === 'nonaktif')) upd.status = st
  const { error } = await adm.from('barang_unit').update(upd).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/barang/${u.jenis_id}`); revalidatePath('/barang')
  redirect(`/barang/${u.jenis_id}`)
}

export async function hapusUnit(fd) {
  const z = await izinAksi('inventaris'); if (z.error) return
  const adm = admin(), id = teks(fd, 'id')
  const { data: u } = await adm.from('barang_unit').select('id,jenis_id,status').eq('id', id).maybeSingle()
  if (!u || u.status === 'dipinjam') return
  const { error } = await adm.from('barang_unit').delete().eq('id', id)
  if (error?.code === '23503') await adm.from('barang_unit').update({ status: 'nonaktif' }).eq('id', id)   // punya riwayat pinjam: nonaktifkan saja
  revalidatePath(`/barang/${u.jenis_id}`); revalidatePath('/barang')
}

// ---------- Impor Excel ----------
function sel(v) {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') return v.richText ? v.richText.map(t => t.text).join('').trim() : ('result' in v ? String(v.result ?? '') : String(v.text ?? '')).trim()
  return String(v).trim()
}
const NAMA_DIVISI = { rc: 'RC', 'panjat tebing': 'RC', hg: 'HG', 'hutan gunung': 'HG', plh: 'PLH', 'pendidikan lingkungan hidup': 'PLH', umum: 'UMUM' }

export async function imporExcel(_p, fd) {
  const z = await izinAksi('inventaris'); if (z.error) return z
  const f = fd.get('berkas')
  if (!f || typeof f === 'string' || !f.size) return { error: 'Pilih berkas .xlsx terlebih dahulu.' }
  if (!/\.xlsx$/i.test(f.name)) return { error: 'Format harus .xlsx (Excel).' }
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  try { await wb.xlsx.load(Buffer.from(await f.arrayBuffer())) } catch { return { error: 'Berkas Excel tidak bisa dibaca.' } }

  const adm = admin()
  const { data: lokasiAda } = await adm.from('lokasi_simpan').select('id,nama')
  const lokasi = new Map((lokasiAda || []).map(l => [l.nama.toLowerCase(), l.id]))
  const { data: jenisAda } = await adm.from('barang_jenis').select('*')
  const peta = new Map((jenisAda || []).map(j => [`${j.divisi}|${j.nama.toLowerCase()}`, j]))
  const urutMax = {}; (jenisAda || []).forEach(j => { urutMax[j.divisi] = Math.max(urutMax[j.divisi] || 0, j.urut) })
  let baru = 0, unit = 0, lewat = 0, proses = 0

  for (const ws of wb.worksheets) {
    let hdr = 0, kol = {}
    for (let r = 1; r <= Math.min(ws.rowCount, 15) && !hdr; r++) {
      const m = {}; ws.getRow(r).eachCell((c, i) => { const t = sel(c.value).toLowerCase(); if (t && m[t] === undefined) m[t] = i })
      if (m['nama barang']) { hdr = r; kol = m }
    }
    if (!hdr) continue
    const divSheet = NAMA_DIVISI[ws.name.trim().toLowerCase()] || null
    if (!divSheet && kol['jumlah'] === undefined) continue           // lembar yang bukan daftar barang (mis. "Per Unit")
    const baca = (row, nama) => kol[nama] ? sel(row.getCell(kol[nama]).value) : ''
    for (let r = hdr + 1; r <= ws.rowCount && proses < 1000; r++) {
      const row = ws.getRow(r)
      const nama = baca(row, 'nama barang').replace(/\s+/g, ' ')
      if (!nama) continue
      proses++
      const divisi = divSheet || NAMA_DIVISI[baca(row, 'divisi').toLowerCase()]
      if (!divisi) { lewat++; continue }
      const jml = baca(row, 'jumlah'); const m = /^(\d+)\s*([A-Za-z]+)?/.exec(jml)
      const jumlah = m ? parseInt(m[1], 10) : 0
      const satuan = (baca(row, 'satuan') || (m && m[2]) || 'buah').toLowerCase()
      const ket = baca(row, 'keterangan').replace(/\s+/g, ' ') || null
      const harga = Number(baca(row, 'harga').replace(/[^\d]/g, '')) || null
      const tidakLayak = /tidak|rusak/i.test(baca(row, 'kondisi'))
      let lokasiId = null
      const ln = baca(row, 'lokasi') || baca(row, 'letak')
      if (ln) {
        lokasiId = lokasi.get(ln.toLowerCase())
        if (!lokasiId) { const { data: l } = await adm.from('lokasi_simpan').insert({ nama: ln }).select('id').single(); lokasiId = l?.id; if (l) lokasi.set(ln.toLowerCase(), l.id) }
      }
      const kunci = `${divisi}|${nama.toLowerCase()}`
      let j = peta.get(kunci), ada = 0
      if (!j) {
        urutMax[divisi] = (urutMax[divisi] || 0) + 1
        const { data, error } = await adm.from('barang_jenis').insert({ divisi, nama, satuan, keterangan: ket, urut: urutMax[divisi] }).select().single()
        if (error) { lewat++; continue }
        j = data; peta.set(kunci, j); baru++
      } else {
        const { count } = await adm.from('barang_unit').select('id', { count: 'exact', head: true }).eq('jenis_id', j.id).neq('status', 'nonaktif'); ada = count || 0
      }
      if (jumlah > ada) unit += await tambahUnit(adm, j, Math.min(jumlah - ada, MAKS_UNIT), { lokasi_id: lokasiId, harga, kondisi: tidakLayak ? 'tidak_layak' : 'layak' })
    }
  }
  revalidatePath('/barang')
  if (!proses) return { error: 'Tidak ada baris barang yang ditemukan. Pakai template dari tombol Unduh Template.' }
  return { ok: `Impor selesai: ${baru} jenis baru, ${unit} unit ditambahkan, ${lewat} baris dilewati.` }
}
