import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import BarisBarang from '@/components/BarisBarang'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { hariIni, tambahHari, TIPE_PINJAM } from '@/lib/format'
import { catatPinjam } from '../actions'
export const dynamic = 'force-dynamic'

export default async function Baru() {
  await wajibMasuk('inventaris')
  const adm = admin()
  const [jenis, mapala] = await Promise.all([
    adm.from('v_stok_jenis').select('id,nama,divisi,tersedia').order('divisi').order('nama').then(ambil),
    adm.from('mapala_mitra').select('id,nama').order('nama').then(ambil)])
  return (<Shell aktif="peminjaman" judul="Catat Peminjaman">
    <FormAksi aksi={catatPinjam} className="form" tombol="Simpan Peminjaman" reset={false}>
      <div className="grid">
        <div><label>Jenis</label><select name="tipe" defaultValue="mapala_pinjam">{Object.entries(TIPE_PINJAM).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
        <div><label>Mapala mitra (untuk 2 jenis mapala)</label><select name="mapala_id"><option value="">-</option>{mapala.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></div>
        <div><label>Tanggal pinjam</label><input type="date" name="tgl_pinjam" defaultValue={hariIni()} required /></div>
        <div><label>Rencana kembali</label><input type="date" name="tgl_kembali" defaultValue={tambahHari(3)} required /></div>
      </div>
      <div className="grid">
        <div><label>Nama peminjam (jenis anggota)</label><input name="nama" /></div>
        <div><label>Nama adat</label><input name="adat" /></div>
        <div><label>No HP / WhatsApp</label><input name="hp" /></div>
      </div>
      <label>Keperluan</label><input name="keperluan" maxLength={300} />
      <label>Barang</label>
      <BarisBarang jenis={jenis} />
      <p className="redup" style={{ margin: '10px 0 0' }}>Untuk <b>kita pinjam ke mapala lain</b>, pilih jenis barangnya (tambahkan dulu di Data Barang bila belum ada). Alat akan tercatat sebagai inventaris sementara sampai dikembalikan.</p>
      <label>Catatan</label><input name="catatan" maxLength={300} />
      <label><input type="checkbox" name="langsung" defaultChecked style={{ marginRight: 8 }} />Langsung serahkan / terima alat (status jadi Dipinjam)</label>
      <label><input type="checkbox" name="buat_surat" style={{ marginRight: 8 }} />Buat nomor surat peminjaman otomatis (khusus jenis mapala; PDF diunggah nanti di Arsip Surat)</label>
    </FormAksi>
    <p><Link href="/peminjaman">Kembali</Link></p>
  </Shell>)
}
