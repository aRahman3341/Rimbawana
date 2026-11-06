import QRCode from 'qrcode'
import { headers } from 'next/headers'
import Shell from '@/components/Shell'
import TombolCetak from '@/components/TombolCetak'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { DIVISI } from '@/lib/format'
export const dynamic = 'force-dynamic'

export default async function CetakQR({ searchParams }) {
  await wajibMasuk()
  const h = headers()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') || 'http'}://${h.get('host')}`
  let q = admin().from('barang_unit').select('nomor, jenis:barang_jenis!inner(nama,divisi)').neq('status', 'nonaktif').order('nomor').limit(400)
  if (searchParams.jenis) q = q.eq('jenis_id', searchParams.jenis)
  if (DIVISI[searchParams.divisi]) q = q.eq('jenis.divisi', searchParams.divisi)
  const unit = ambil(await q)
  const gambar = await Promise.all(unit.map(u => QRCode.toDataURL(`${origin}/u/${encodeURIComponent(u.nomor)}`, { margin: 1, width: 260 })))
  return (<Shell aktif="barang" judul="Cetak Label QR">
    <div className="baris tanpa-cetak"><TombolCetak teks="Cetak Label" /><span className="redup">{unit.length} label. Tempel di barang; saat dipindai, QR membuka halaman info barang.</span></div>
    {unit.length === 0 ? <p className="kosong">Tidak ada unit untuk dicetak.</p> : (
      <div className="label-qr">
        {unit.map((u, i) => (<figure key={u.nomor}><img src={gambar[i]} alt={u.nomor} />
          <figcaption><b>{u.nomor}</b>{u.jenis.nama}<br />Rimbawana UPI Cibiru</figcaption></figure>))}
      </div>)}
  </Shell>)
}
