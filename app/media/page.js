import Shell from '@/components/Shell'
import MintaAkses from '@/components/MintaAkses'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { mini } from '@/lib/berkas'
import { tgl, hariIni } from '@/lib/format'
import { tambahMedia, ubahTampil, hapusMedia } from './actions'
export const dynamic = 'force-dynamic'

const IKON = { foto: 'image', video: 'play-btn', album: 'collection', dokumen: 'file-earmark-text' }
export default async function Media() {
  const saya = await wajibMasuk('lihat')
  const edit = boleh(saya, 'profil')
  const daftar = ambil(await admin().from('media_rimbawana').select('*').order('created_at', { ascending: false }).limit(300))
  return (<Shell aktif="media" judul="Galeri Media">
    {!(edit) && <MintaAkses izin="profil" />}
    <p className="redup" style={{ marginTop: 0 }}>Foto dan video Rimbawana disimpan di Google Drive. Di sini hanya dicatat tautannya, lalu tampil di halaman <b>Galeri</b> situs publik.</p>
    {edit && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Tambah Media</summary>
      <FormAksi aksi={tambahMedia} className="form" tombol="Simpan Media">
        <div className="grid">
          <div><label>Jenis</label><select name="jenis"><option value="foto">Foto</option><option value="video">Video</option><option value="album">Album (folder Drive)</option><option value="dokumen">Dokumen</option></select></div>
          <div><label>Judul</label><input name="judul" required maxLength={120} /></div>
          <div><label>Tanggal kegiatan</label><input type="date" name="tanggal" defaultValue={hariIni()} /></div>
        </div>
        <label>Deskripsi</label><input name="deskripsi" maxLength={300} />
        <UnggahBerkas name="media" bucket="foto" folder="galeri" drive accept="image/png,image/jpeg,image/webp" label="Sumber media" bantuan="Foto kecil bisa diunggah langsung. Video, foto besar, atau album: tempel link Google Drive." />
      </FormAksi></details>}
    <div className="tabel"><table>
      <thead><tr><th></th><th>Judul</th><th>Jenis</th><th>Tanggal</th><th>Sumber</th><th>Publik</th>{edit && <th></th>}</tr></thead>
      <tbody>
        {daftar.length === 0 && <tr><td colSpan={7} className="kosong">Belum ada media.</td></tr>}
        {daftar.map(m => (<tr key={m.id}>
          <td>{mini(m, 120) ? <img className="thumb" src={mini(m, 120)} alt="" loading="lazy" /> : <div className="thumb ikon"><i className={`bi bi-${IKON[m.jenis]}`} /></div>}</td>
          <td className="bungkus"><b>{m.judul}</b>{m.deskripsi && <small><br />{m.deskripsi}</small>}</td>
          <td><span className="lencana coklat">{m.jenis}</span></td><td>{tgl(m.tanggal)}</td>
          <td>{m.drive_url ? <a href={m.drive_url} target="_blank" rel="noreferrer"><i className="bi bi-google" /> Drive</a> : 'Storage'}{m.drive_ukuran > 0 && <small> {(m.drive_ukuran / 1048576).toFixed(1)} MB</small>}</td>
          <td><span className={`lencana ${m.tampil ? 'hijau' : 'abu'}`}>{m.tampil ? 'tampil' : 'disembunyikan'}</span></td>
          {edit && <td><TombolAksi aksi={ubahTampil} data={{ id: m.id, tampil: m.tampil ? '0' : '1' }} ikon={m.tampil ? 'eye-slash' : 'eye'} title={m.tampil ? 'Sembunyikan' : 'Tampilkan'} />{' '}
            <TombolAksi aksi={hapusMedia} data={{ id: m.id }} ikon="trash" cls="kecil bahaya" konfirmasi="Hapus media ini dari galeri? File di Drive tidak ikut terhapus." /></td>}
        </tr>))}
      </tbody></table></div>
  </Shell>)
}
