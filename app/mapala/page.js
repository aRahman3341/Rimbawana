import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { tambahMapala, hapusMapala } from './actions'
export const dynamic = 'force-dynamic'
export default async function Mapala() {
  await wajibMasuk('inventaris')
  const daftar = ambil(await admin().from('mapala_mitra').select('*').order('nama'))
  return (<Shell aktif="mapala" judul="Mapala Mitra">
    <div className="dua">
      <FormAksi aksi={tambahMapala} className="form" tombol="Tambah Mapala"><h2>Tambah mapala mitra</h2>
        <label>Nama mapala</label><input name="nama" required maxLength={80} />
        <label>Kampus</label><input name="kampus" maxLength={80} />
        <div className="grid"><div><label>Nama kontak</label><input name="kontak_nama" maxLength={60} /></div><div><label>No HP kontak</label><input name="kontak_hp" maxLength={20} /></div></div>
        <label>Alamat sekretariat</label><input name="alamat" maxLength={160} /></FormAksi>
      <div className="tabel"><table><thead><tr><th>Mapala</th><th>Kampus</th><th>Kontak</th><th></th></tr></thead><tbody>
        {daftar.length === 0 && <tr><td colSpan={4} className="kosong">Belum ada mapala mitra.</td></tr>}
        {daftar.map(m => <tr key={m.id}><td><b>{m.nama}</b></td><td>{m.kampus || '-'}</td><td>{m.kontak_nama || '-'} {m.kontak_hp && <small>({m.kontak_hp})</small>}</td>
          <td><TombolAksi aksi={hapusMapala} data={{ id: m.id }} ikon="trash" cls="kecil bahaya" konfirmasi="Hapus mapala mitra ini?" /></td></tr>)}
      </tbody></table></div>
    </div></Shell>)
}
