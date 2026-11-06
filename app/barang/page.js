import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { urlFoto } from '@/lib/berkas'
import { DIVISI, rupiah } from '@/lib/format'
import { tambahJenis } from './actions'
export const dynamic = 'force-dynamic'

export default async function Barang({ searchParams }) {
  const saya = await wajibMasuk()
  const kelola = boleh(saya, 'inventaris')
  const div = DIVISI[searchParams.divisi] ? searchParams.divisi : ''
  const cari = String(searchParams.q || '').replace(/[%_\\]/g, '').slice(0, 60)
  const adm = admin()
  let q = adm.from('v_stok_jenis').select('*').order('divisi').order('urut')
  if (div) q = q.eq('divisi', div)
  if (cari) q = q.ilike('nama', `%${cari}%`)
  const [daftar, lokasi] = await Promise.all([q.then(ambil), adm.from('lokasi_simpan').select('id,nama').order('nama').then(ambil)])
  const jml = (k) => daftar.reduce((a, j) => a + Number(j[k]), 0)
  return (<Shell aktif="barang" judul="Data Barang">
    <div className="cards">
      <div className="info"><i className="bi bi-box-seam" /><div><h3>{daftar.length}</h3><span>Jenis barang</span></div></div>
      <div className="info"><i className="bi bi-stack" /><div><h3>{jml('total')}</h3><span>Total unit</span></div></div>
      <div className="info biru"><i className="bi bi-check2-circle" /><div><h3>{jml('tersedia')}</h3><span>Tersedia dipinjam</span></div></div>
      <div className="info api"><i className="bi bi-arrow-left-right" /><div><h3>{jml('dipinjam')}</h3><span>Sedang dipinjam</span></div></div>
      <div className="info merah"><i className="bi bi-exclamation-triangle" /><div><h3>{jml('tidak_layak')}</h3><span>Tidak layak pakai</span></div></div>
      <div className="info"><i className="bi bi-cash-coin" /><div><h3 style={{ fontSize: '1.2rem' }}>{rupiah(jml('nilai'))}</h3><span>Nilai tercatat</span></div></div>
    </div>

    <div className="baris">
      <form className="cari">{div && <input type="hidden" name="divisi" value={div} />}
        <input name="q" placeholder="Cari nama barang" defaultValue={cari} /><button>Cari</button></form>
      <a className="btn kuning kecil" href="/api/export/barang"><i className="bi bi-download" /> Ekspor Excel</a>
      <Link className="btn kecil abu" href={`/barang/qr${div ? `?divisi=${div}` : ''}`}><i className="bi bi-qr-code" /> Cetak QR</Link>
      {kelola && <Link className="btn kecil abu" href="/barang/impor"><i className="bi bi-upload" /> Impor Excel</Link>}
    </div>
    <div className="tabs">
      <Link className={`tab ${!div ? 'aktif' : ''}`} href="/barang">Semua</Link>
      {Object.entries(DIVISI).map(([k, t]) => <Link key={k} className={`tab ${div === k ? 'aktif' : ''}`} href={`/barang?divisi=${k}`}>{t}</Link>)}
    </div>

    {kelola && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Tambah Barang</summary>
      <FormAksi aksi={tambahJenis} className="form" tombol="Simpan Barang">
        <div className="grid">
          <div><label>Divisi</label><select name="divisi" defaultValue={div || 'RC'}>{Object.entries(DIVISI).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
          <div><label>Nama barang</label><input name="nama" required maxLength={80} /></div>
          <div><label>Satuan</label><input name="satuan" defaultValue="buah" /></div>
          <div><label>Jumlah unit awal</label><input name="jumlah" type="number" min="0" max="300" defaultValue="1" /></div>
          <div><label>Harga per unit (Rp, opsional)</label><input name="harga" inputMode="numeric" /></div>
          <div><label>Kondisi awal</label><select name="kondisi"><option value="layak">Layak pakai</option><option value="tidak_layak">Tidak layak pakai</option></select></div>
          <div><label>Lokasi simpan</label><select name="lokasi_id"><option value="">-</option>{lokasi.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}</select></div>
        </div>
        <label>Keterangan (warna, ukuran, dll)</label><input name="keterangan" maxLength={200} />
        <UnggahBerkas name="foto" bucket="foto" folder="barang" accept="image/png,image/jpeg,image/webp" label="Foto (opsional)" />
      </FormAksi></details>}

    <div className="tabel"><table>
      <thead><tr><th></th><th>Nama barang</th><th>Divisi</th><th className="angka">Total</th><th className="angka">Layak</th><th className="angka">Tidak layak</th><th className="angka">Tersedia</th><th className="angka">Dipinjam</th><th>Keterangan</th><th></th></tr></thead>
      <tbody>
        {daftar.length === 0 && <tr><td colSpan={10} className="kosong">Belum ada barang.</td></tr>}
        {daftar.map(j => (<tr key={j.id}>
          <td>{j.foto_path ? <img className="thumb" src={urlFoto(j.foto_path)} alt="" /> : <div className="thumb ikon"><i className="bi bi-box-seam" /></div>}</td>
          <td><b>{j.nama}</b></td><td><span className="lencana coklat">{j.divisi}</span></td>
          <td className="angka">{j.total} <small>{j.satuan}</small></td><td className="angka">{j.layak}</td>
          <td className="angka">{j.tidak_layak > 0 ? <span className="lencana merah">{j.tidak_layak}</span> : 0}</td>
          <td className="angka"><b>{j.tersedia}</b></td><td className="angka">{j.dipinjam}</td>
          <td className="bungkus">{j.keterangan || '-'}</td>
          <td><Link className="btn kecil" href={`/barang/${j.id}`}>{kelola ? 'Kelola' : 'Lihat'}</Link></td></tr>))}
      </tbody></table></div>
  </Shell>)
}
