import Link from 'next/link'
import { notFound } from 'next/navigation'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { urlFoto } from '@/lib/berkas'
import { DIVISI, rupiah, tgl } from '@/lib/format'
import { ubahJenis, hapusJenis, tambahUnitAksi, ubahUnit, hapusUnit } from '../actions'
export const dynamic = 'force-dynamic'

export default async function DetailBarang({ params, searchParams }) {
  const saya = await wajibMasuk()
  const kelola = boleh(saya, 'inventaris')
  const adm = admin()
  const j = ambil(await adm.from('barang_jenis').select('*').eq('id', params.id).maybeSingle())
  if (!j) notFound()
  const [unit, lokasi] = await Promise.all([
    adm.from('barang_unit').select('*, lokasi:lokasi_simpan(nama), pemilik:mapala_mitra(nama)').eq('jenis_id', j.id).neq('status', 'nonaktif').order('nomor').then(ambil),
    adm.from('lokasi_simpan').select('id,nama').order('nama').then(ambil)])
  const edit = unit.find(u => u.id === searchParams.edit)
  const opsiLokasi = (pilih) => <>{<option value="">-</option>}{lokasi.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}</>
  return (<Shell aktif="barang" judul={j.nama}>
    <div className="baris">
      <Link className="btn kecil abu" href="/barang"><i className="bi bi-arrow-left" /> Kembali</Link>
      <Link className="btn kecil abu" href={`/barang/qr?jenis=${j.id}`}><i className="bi bi-qr-code" /> Cetak QR barang ini</Link>
      <span className="lencana coklat">{DIVISI[j.divisi]}</span>
      {j.foto_path && <img className="thumb" src={urlFoto(j.foto_path)} alt="" />}
    </div>

    {edit && kelola && <FormAksi aksi={ubahUnit} className="form" tombol="Simpan Unit" reset={false}>
      <h2>Ubah unit {edit.nomor}</h2><input type="hidden" name="id" value={edit.id} />
      <div className="grid">
        <div><label>Kondisi</label><select name="kondisi" defaultValue={edit.kondisi}><option value="layak">Layak pakai</option><option value="tidak_layak">Tidak layak pakai</option></select></div>
        <div><label>Harga (Rp)</label><input name="harga" inputMode="numeric" defaultValue={edit.harga ?? ''} /></div>
        <div><label>Tahun beli</label><input name="tahun_beli" inputMode="numeric" defaultValue={edit.tahun_beli ?? ''} /></div>
        <div><label>Lokasi simpan</label><select name="lokasi_id" defaultValue={edit.lokasi_id || ''}>{opsiLokasi()}</select></div>
        {edit.status !== 'dipinjam' && <div><label>Status</label><select name="status" defaultValue={edit.status}><option value="tersedia">Tersedia</option><option value="nonaktif">Nonaktif (sembunyikan)</option></select></div>}
      </div>
      <label>Keterangan</label><input name="keterangan" defaultValue={edit.keterangan || ''} maxLength={200} />
      <p><Link href={`/barang/${j.id}`}>Batal</Link></p>
    </FormAksi>}

    <div className="tabel" style={{ marginBottom: 18 }}><table>
      <thead><tr><th>Nomor</th><th>Kondisi</th><th>Status</th><th>Lokasi</th><th className="angka">Harga</th><th>Tahun</th><th>Keterangan</th>{kelola && <th></th>}</tr></thead>
      <tbody>
        {unit.length === 0 && <tr><td colSpan={8} className="kosong">Belum ada unit. Tambahkan di bawah.</td></tr>}
        {unit.map(u => (<tr key={u.id}>
          <td><b>{u.nomor}</b></td>
          <td><span className={`lencana ${u.kondisi === 'layak' ? 'hijau' : 'merah'}`}>{u.kondisi === 'layak' ? 'Layak' : 'Tidak layak'}</span></td>
          <td><span className={`lencana ${u.status === 'tersedia' ? 'hijau' : 'kuning'}`}>{u.status}</span>
            {u.pemilik && <span className="lencana biru" title={`Pinjaman dari ${u.pemilik.nama}`} style={{ marginLeft: 4 }}>pinjaman {u.pemilik.nama}{u.batas_kembali ? ` s.d. ${tgl(u.batas_kembali)}` : ''}</span>}</td>
          <td>{u.lokasi?.nama || '-'}</td><td className="angka">{u.harga ? rupiah(u.harga) : '-'}</td><td>{u.tahun_beli || '-'}</td><td className="bungkus">{u.keterangan || '-'}</td>
          {kelola && <td><Link className="btn kecil" href={`/barang/${j.id}?edit=${u.id}`}>Ubah</Link>{' '}
            {u.status !== 'dipinjam' && <TombolAksi aksi={hapusUnit} data={{ id: u.id }} ikon="trash" cls="kecil bahaya" konfirmasi={`Hapus unit ${u.nomor}?`} title="Hapus" />}</td>}
        </tr>))}
      </tbody></table></div>

    {kelola && <div className="dua">
      <FormAksi aksi={tambahUnitAksi} className="form" tombol="Tambah Unit">
        <h2>Tambah unit</h2><input type="hidden" name="jenis_id" value={j.id} />
        <div className="grid">
          <div><label>Jumlah</label><input name="jumlah" type="number" min="1" max="300" defaultValue="1" /></div>
          <div><label>Harga per unit (Rp)</label><input name="harga" inputMode="numeric" /></div>
          <div><label>Kondisi</label><select name="kondisi"><option value="layak">Layak pakai</option><option value="tidak_layak">Tidak layak pakai</option></select></div>
          <div><label>Lokasi simpan</label><select name="lokasi_id">{opsiLokasi()}</select></div>
        </div>
        <label>Keterangan</label><input name="keterangan" maxLength={200} />
      </FormAksi>
      <div>
        <FormAksi aksi={ubahJenis} className="form" tombol="Simpan Perubahan" reset={false}>
          <h2>Data barang</h2><input type="hidden" name="id" value={j.id} />
          <label>Nama</label><input name="nama" defaultValue={j.nama} required />
          <div className="grid"><div><label>Divisi</label><select name="divisi" defaultValue={j.divisi}>{Object.entries(DIVISI).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
            <div><label>Satuan</label><input name="satuan" defaultValue={j.satuan} /></div></div>
          <label>Keterangan</label><input name="keterangan" defaultValue={j.keterangan || ''} />
          <UnggahBerkas name="foto" bucket="foto" folder="barang" accept="image/png,image/jpeg,image/webp" label="Ganti foto (opsional)" />
        </FormAksi>
        <FormAksi aksi={hapusJenis} className="form" tombol="Hapus Barang Ini" bahaya konfirmasi="Hapus barang ini beserta semua unitnya?">
          <input type="hidden" name="id" value={j.id} /><p className="redup" style={{ margin: 0 }}>Tidak bisa dihapus jika pernah dipakai di peminjaman.</p>
        </FormAksi>
      </div>
    </div>}
  </Shell>)
}
