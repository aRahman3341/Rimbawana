import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import { wajibMasuk } from '@/lib/auth'
import { imporExcel } from '../actions'
export const dynamic = 'force-dynamic'

export default async function Impor() {
  await wajibMasuk('inventaris')
  return (<Shell aktif="barang" judul="Impor Excel">
    <div className="form" style={{ maxWidth: 680 }}>
      <h2>Cara impor</h2>
      <ol style={{ paddingLeft: 20, margin: '6px 0 12px' }}>
        <li>Unduh template, isi satu baris per jenis barang.</li>
        <li>Kolom: <b>Divisi</b> (RC / HG / PLH / UMUM), <b>Nama Barang</b>, Satuan, <b>Jumlah</b>, Harga, Lokasi, Keterangan.</li>
        <li>Format lama Excel Rimbawana (lembar bernama RC, HG, Umum dengan kolom Nama Barang dan Jumlah) juga bisa langsung diunggah.</li>
        <li>Impor ulang aman: unit hanya ditambah sampai sesuai jumlah, tidak digandakan.</li>
      </ol>
      <p><a className="btn kuning kecil" href="/api/export/barang?template=1"><i className="bi bi-file-earmark-excel" /> Unduh Template</a></p>
    </div>
    <FormAksi aksi={imporExcel} className="form" tombol="Impor Sekarang" reset={false}>
      <label>Berkas Excel (.xlsx)</label><input type="file" name="berkas" accept=".xlsx" required />
    </FormAksi>
    <p><Link href="/barang">Kembali ke Data Barang</Link></p>
  </Shell>)
}
