import { NextResponse } from 'next/server'
import { getSaya } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const kepala = (ws, cols) => {
  ws.columns = cols.map(([header, key, width]) => ({ header, key, width }))
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F6B3F' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

export async function GET(req) {
  const saya = await getSaya()
  if (!saya) return new NextResponse('Silakan login.', { status: 401 })
  const template = new URL(req.url).searchParams.get('template')
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  let nama = 'Inventaris_Rimbawana.xlsx'
  if (template) {
    nama = 'Template_Impor_Inventaris.xlsx'
    const ws = wb.addWorksheet('Inventaris')
    kepala(ws, [['Divisi', 'divisi', 10], ['Nama Barang', 'nama', 30], ['Satuan', 'satuan', 10], ['Jumlah', 'jumlah', 10], ['Harga', 'harga', 14], ['Lokasi', 'lokasi', 18], ['Keterangan', 'ket', 40]])
    ws.addRow({ divisi: 'RC', nama: 'Carabiner Screw', satuan: 'buah', jumlah: 10, harga: 85000, lokasi: 'Lemari 1', ket: 'Contoh baris. Hapus sebelum impor.' })
  } else {
    const adm = admin()
    const [jenis, unit] = await Promise.all([
      adm.from('v_stok_jenis').select('*').order('divisi').order('urut').then(ambil),
      adm.from('barang_unit').select('nomor,kondisi,status,harga,tahun_beli,keterangan,jenis:barang_jenis(nama,divisi),lokasi:lokasi_simpan(nama),pemilik:mapala_mitra(nama)').neq('status', 'nonaktif').order('nomor').then(ambil)])
    const a = wb.addWorksheet('Per Jenis')
    kepala(a, [['Divisi', 'divisi', 10], ['Nama Barang', 'nama', 30], ['Satuan', 'satuan', 10], ['Jumlah', 'total', 10], ['Layak', 'layak', 8], ['Tidak Layak', 'tl', 12], ['Tersedia', 'ters', 10], ['Dipinjam', 'dip', 10], ['Nilai (Rp)', 'nilai', 14], ['Keterangan', 'ket', 40]])
    jenis.forEach(j => a.addRow({ divisi: j.divisi, nama: j.nama, satuan: j.satuan, total: Number(j.total), layak: Number(j.layak), tl: Number(j.tidak_layak), ters: Number(j.tersedia), dip: Number(j.dipinjam), nilai: Number(j.nilai), ket: j.keterangan }))
    const b = wb.addWorksheet('Per Unit')
    kepala(b, [['Nomor', 'nomor', 16], ['Divisi', 'divisi', 8], ['Nama Barang', 'nama', 30], ['Lokasi', 'lokasi', 18], ['Kondisi', 'kondisi', 12], ['Status', 'status', 12], ['Harga', 'harga', 14], ['Tahun Beli', 'tahun', 10], ['Pemilik (jika pinjaman)', 'pemilik', 22], ['Keterangan', 'ket', 40]])
    unit.forEach(u => b.addRow({ nomor: u.nomor, divisi: u.jenis.divisi, nama: u.jenis.nama, lokasi: u.lokasi?.nama, kondisi: u.kondisi === 'layak' ? 'Layak' : 'Tidak layak', status: u.status, harga: u.harga ? Number(u.harga) : null, tahun: u.tahun_beli, pemilik: u.pemilik?.nama, ket: u.keterangan }))
  }
  const buf = await wb.xlsx.writeBuffer()
  return new NextResponse(buf, { headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${nama}"` } })
}
