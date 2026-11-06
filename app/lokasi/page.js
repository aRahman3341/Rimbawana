import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { tambahLokasi, hapusLokasi } from './actions'
export const dynamic = 'force-dynamic'
export default async function Lokasi() {
  await wajibMasuk('inventaris')
  const adm = admin()
  const [daftar, unit] = await Promise.all([adm.from('lokasi_simpan').select('*').order('nama').then(ambil), adm.from('barang_unit').select('lokasi_id').not('lokasi_id', 'is', null).then(ambil)])
  const hitung = {}; unit.forEach(u => { hitung[u.lokasi_id] = (hitung[u.lokasi_id] || 0) + 1 })
  return (<Shell aktif="lokasi" judul="Lokasi Simpan">
    <div className="dua">
      <FormAksi aksi={tambahLokasi} className="form" tombol="Tambah Lokasi"><h2>Tambah lokasi</h2>
        <label>Nama (mis. Lemari 1, Rak Panjat)</label><input name="nama" required maxLength={60} />
        <label>Keterangan</label><input name="keterangan" maxLength={120} /></FormAksi>
      <div className="tabel"><table><thead><tr><th>Lokasi</th><th>Keterangan</th><th className="angka">Unit</th><th></th></tr></thead><tbody>
        {daftar.length === 0 && <tr><td colSpan={4} className="kosong">Belum ada lokasi.</td></tr>}
        {daftar.map(l => <tr key={l.id}><td><b>{l.nama}</b></td><td>{l.keterangan || '-'}</td><td className="angka">{hitung[l.id] || 0}</td>
          <td><TombolAksi aksi={hapusLokasi} data={{ id: l.id }} ikon="trash" cls="kecil bahaya" konfirmasi="Hapus lokasi? Unit di lokasi ini menjadi tanpa lokasi." /></td></tr>)}
      </tbody></table></div>
    </div></Shell>)
}
