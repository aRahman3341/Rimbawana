import Shell from '@/components/Shell'
import MintaAkses from '@/components/MintaAkses'
import FormAksi from '@/components/FormAksi'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { getProfil } from '@/lib/profil'
import { tahunIni, labelAngkatan } from '@/lib/angkatan'
import { tambahAngkatan, tambahMassal, ubahAngkatan, hapusAngkatan } from './actions'
export const dynamic = 'force-dynamic'

export default async function Angkatan({ searchParams }) {
  const saya = await wajibMasuk('lihat')
  const edit = boleh(saya, 'profil')
  const adm = admin()
  const [{ identitas }, daftar, anggota, sejarah] = await Promise.all([
    getProfil(),
    adm.from('angkatan').select('*').order('tahun', { nullsFirst: true }).order('nama').then(ambil),
    adm.from('anggota').select('angkatan_id').not('angkatan_id', 'is', null).neq('peran', 'founder').then(ambil),
    adm.from('profil_sejarah').select('tahun').then(ambil)])
  const sekarang = tahunIni(), mulai = Math.max(Number(identitas.tahun_berdiri) || 2004, 1990)
  const tahunList = Array.from({ length: sekarang - mulai + 1 }, (_, i) => mulai + i)
  const pilihTahun = Array.from({ length: sekarang + 1 - mulai + 1 }, (_, i) => sekarang + 1 - i)    // terbaru di atas
  const pakai = {}; anggota.forEach(a => { pakai[a.angkatan_id] = (pakai[a.angkatan_id] || 0) + 1 })
  const perTahun = {}; daftar.filter(a => a.tahun).forEach(a => { (perTahun[a.tahun] ||= []).push(a) })
  const cerita = new Set(sejarah.map(s => Number(/\d{4}/.exec(s.tahun || '')?.[0])).filter(Boolean))
  const tanpaTahun = daftar.filter(a => !a.tahun)
  const terisi = tahunList.filter(t => perTahun[t]?.length).length
  const awalan = Number(searchParams.tahun) || sekarang

  const Baris = ({ a }) => (<tr key={a.id}>
    <td className="bungkus"><b>{a.nama}</b>{a.keterangan && <small><br />{a.keterangan}</small>}</td>
    <td>{a.kode ? <span className="lencana coklat">{a.kode}</span> : <small className="redup">-</small>}</td>
    <td className="angka">{pakai[a.id] || 0}</td>
    {edit && <td style={{ minWidth: 150 }}><details><summary className="btn kecil abu" style={{ listStyle: 'none' }}>Ubah / hapus</summary>
      <FormAksi aksi={ubahAngkatan} className="form" tombol="Simpan" kecil reset={false}>
        <input type="hidden" name="id" value={a.id} />
        <label>Tahun</label><select name="tahun" defaultValue={a.tahun || ''}>{!a.tahun && <option value="">- pilih -</option>}{pilihTahun.map(t => <option key={t}>{t}</option>)}</select>
        <label>Nama angkatan</label><input name="nama" defaultValue={a.nama} required maxLength={80} />
        <label>Singkatan (opsional)</label><input name="kode" defaultValue={a.kode || ''} maxLength={10} />
        <label>Keterangan (opsional)</label><input name="keterangan" defaultValue={a.keterangan || ''} maxLength={200} />
      </FormAksi>
      <FormAksi aksi={hapusAngkatan} className="" tombol="Hapus angkatan" kecil bahaya konfirmasi={`Hapus angkatan ${a.nama}?`}><input type="hidden" name="id" value={a.id} /></FormAksi>
    </details></td>}
  </tr>)

  return (<Shell aktif="angkatan" judul="Data Angkatan">
    {!(edit) && <MintaAkses izin="profil" />}
    <div className="form">
      <h2>Catatan angkatan per tahun</h2>
      <p style={{ margin: 0 }}>Isi nama angkatan untuk setiap tahun sejak {mulai}. Data ini otomatis tampil di halaman <b>Tentang &gt; Sejarah</b> dan menjadi pilihan angkatan pada <b>data anggota</b>. <b>Singkatan boleh dikosongkan.</b></p>
      <p className="redup" style={{ margin: '8px 0 0' }}>Terisi {terisi} dari {tahunList.length} tahun{tanpaTahun.length > 0 && <>, dan <b>{tanpaTahun.length} angkatan belum diberi tahun</b></>}. {edit ? 'Klik sebuah tahun di bawah untuk mengisinya.' : 'Pengisian dilakukan Sekretaris.'}</p>
    </div>

    <div className="tabs" style={{ marginTop: 14 }}>
      {tahunList.map(t => { const n = perTahun[t]?.length || 0
        return <a key={t} href={`/angkatan?tahun=${t}#isi`} className={`tab ${n ? 'aktif' : ''}`} style={n ? undefined : { borderStyle: 'dashed', color: 'var(--redup)' }}
          title={n ? `${n} angkatan` : 'Belum diisi'}>{t}{n > 0 && <small> &middot; {n}</small>}{cerita.has(t) && ' \u270E'}</a> })}
    </div>
    <p className="redup" style={{ margin: '0 0 16px', fontSize: '.82rem' }}>Tahun bergaris putus-putus = belum ada angkatan. Tanda &#9998; = sudah ada cerita sejarah tahun itu.</p>

    {edit && <div className="dua" id="isi">
      <FormAksi aksi={tambahAngkatan} className="form" tombol="Tambah Angkatan">
        <h2>Tambah angkatan</h2>
        <div className="grid">
          <div><label>Tahun</label><select name="tahun" defaultValue={awalan}>{pilihTahun.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label>Singkatan (opsional)</label><input name="kode" maxLength={10} placeholder="mis. SPG" /></div>
        </div>
        <label>Nama angkatan</label><input name="nama" required maxLength={80} placeholder="mis. Sawala Pavana Garuda" />
        <label>Keterangan (opsional)</label><input name="keterangan" maxLength={200} placeholder="mis. Diklatsar angkatan XXIII" />
      </FormAksi>
      <FormAksi aksi={tambahMassal} className="form" tombol="Tambah Semua">
        <h2>Isi banyak sekaligus</h2>
        <p className="redup" style={{ margin: '0 0 6px' }}>Satu baris satu angkatan, dipisah tanda <b>|</b>. Singkatan boleh dikosongkan.</p>
        <textarea name="teks" rows={6} placeholder={'2004 | Nama Angkatan Pertama | SNG\n2005 | Nama Angkatan Kedua\n2006 | Nama Angkatan Ketiga | TGA'} style={{ fontFamily: 'ui-monospace, monospace', fontSize: '.88rem' }} />
      </FormAksi>
    </div>}

    {tanpaTahun.length > 0 && <>
      <h2 style={{ margin: '22px 0 10px', fontSize: '1.1rem' }}>Belum diberi tahun</h2>
      <div className="tabel"><table><thead><tr><th>Angkatan</th><th>Singkatan</th><th className="angka">Anggota</th>{edit && <th></th>}</tr></thead><tbody>
        {tanpaTahun.map(a => Baris({ a }))}</tbody></table></div></>}

    <h2 style={{ margin: '22px 0 10px', fontSize: '1.1rem' }}>Daftar per tahun</h2>
    {Object.keys(perTahun).length === 0 && <p className="kosong">Belum ada angkatan yang diisi tahunnya.</p>}
    {Object.keys(perTahun).sort((a, b) => a - b).map(t => (
      <div key={t} style={{ marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--display)', letterSpacing: '.05em', fontWeight: 400, fontSize: '1.4rem', color: 'var(--tanah)' }}>{t}</h3>
        <div className="tabel"><table><thead><tr><th>Angkatan</th><th>Singkatan</th><th className="angka">Anggota</th>{edit && <th></th>}</tr></thead><tbody>
          {perTahun[t].map(a => Baris({ a }))}</tbody></table></div>
      </div>))}
  </Shell>)
}
