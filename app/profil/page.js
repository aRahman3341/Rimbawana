import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { getProfil, IKON, LOGO_BAWAAN } from '@/lib/profil'
import { simpanIdentitas, simpanLogo, kembalikanLogo, simpanSejarah, hapusSejarah, simpanDivisi, hapusDivisi, simpanKaderisasi, hapusKaderisasi } from './actions'
export const dynamic = 'force-dynamic'

export default async function Profil() {
  await wajibMasuk('profil')
  const adm = admin()
  const { identitas: i, logo } = await getProfil()
  const [sejarah, divisi, kader] = await Promise.all([
    adm.from('profil_sejarah').select('*').order('urut').order('created_at').then(ambil),
    adm.from('profil_divisi').select('*').order('urut').then(ambil),
    adm.from('profil_kaderisasi').select('*').order('urut').then(ambil)])
  const sosial = (i.sosial || []).map(s => `${s.nama} | ${s.ikon} | ${s.url}`).join('\n')
  return (<Shell aktif="profil" judul="Profil Situs">
    <p className="redup" style={{ marginTop: 0 }}>Semua yang tampil di halaman Beranda dan Tentang bisa diubah di sini. Perubahan langsung tampil di situs publik.</p>

    <div className="form" style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}><img src={logo} alt="Logo saat ini" style={{ height: 120, width: 'auto', background: 'var(--hutan)', borderRadius: 14, padding: 12 }} /><br /><small className="redup">Logo saat ini</small></div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <FormAksi aksi={simpanLogo} tombol="Ganti Logo" reset={false}>
          <h2>Logo Rimbawana</h2>
          <UnggahBerkas name="logo" bucket="foto" folder="logo" accept="image/png,image/jpeg,image/webp" label="Gambar logo baru" bantuan="Disarankan PNG berlatar transparan, maks 10 MB. Tampil di navigasi, beranda, login, dan menu admin." />
        </FormAksi>
        {logo !== LOGO_BAWAAN && <div style={{ marginTop: 10 }}><TombolAksi aksi={kembalikanLogo} teks="Kembalikan logo bawaan" cls="kecil abu" konfirmasi="Kembalikan ke logo bawaan?" /></div>}
      </div>
    </div>

    <FormAksi aksi={simpanIdentitas} className="form" tombol="Simpan Identitas" reset={false}>
      <h2>Identitas dan kontak</h2>
      <div className="grid">
        <div><label>Nama singkat</label><input name="nama" defaultValue={i.nama} required /></div>
        <div><label>Nama lengkap organisasi</label><input name="lengkap" defaultValue={i.lengkap} required /></div>
        <div><label>Kampus</label><input name="kampus" defaultValue={i.kampus} /></div>
        <div><label>Email</label><input name="email" type="email" defaultValue={i.email} /></div>
        <div><label>Tahun berdiri</label><input name="tahun_berdiri" type="number" min="1990" max={new Date().getFullYear()} defaultValue={i.tahun_berdiri} required /></div>
      </div>
      <label>Alamat sekretariat</label><input name="alamat" defaultValue={i.alamat} />
      <label>Tagline</label><input name="tagline" defaultValue={i.tagline} />
      <label>Sosial media (satu per baris: Nama | ikon | link)</label>
      <textarea name="sosial" defaultValue={sosial} placeholder="Instagram | instagram | https://instagram.com/rimbawana" />
      <small>Ikon contoh: instagram, youtube, tiktok, whatsapp, facebook, twitter-x.</small>
    </FormAksi>

    <h2 style={{ margin: '26px 0 4px' }}>Sejarah Rimbawana</h2>
    <p className="redup" style={{ margin: '0 0 10px' }}>Cerita per tahun. Nama angkatan tiap tahun diisi di menu <a href="/angkatan">Data Angkatan</a> dan otomatis tampil di halaman sejarah.</p>
    {sejarah.map(s => <div key={s.id} className="form"><FormAksi aksi={simpanSejarah} tombol="Simpan" kecil reset={false}>
      <input type="hidden" name="id" value={s.id} />
      <div className="grid"><div><label>Tahun</label><input name="tahun" defaultValue={s.tahun || ''} /></div><div><label>Judul</label><input name="judul" defaultValue={s.judul || ''} /></div><div><label>Urutan</label><input name="urut" type="number" defaultValue={s.urut} /></div></div>
      <label>Cerita</label><textarea name="isi" defaultValue={s.isi} required /></FormAksi>
      <TombolAksi aksi={hapusSejarah} data={{ id: s.id }} ikon="trash" teks="Hapus" cls="kecil bahaya" konfirmasi="Hapus bagian sejarah ini?" /></div>)}
    <FormAksi aksi={simpanSejarah} className="form" tombol="Tambah Bagian Sejarah"><h2>Tambah bagian sejarah</h2>
      <div className="grid"><div><label>Tahun</label><input name="tahun" placeholder="mis. 2005" /></div><div><label>Judul</label><input name="judul" placeholder="mis. Awal berdiri" /></div><div><label>Urutan</label><input name="urut" type="number" defaultValue={sejarah.length + 1} /></div></div>
      <label>Cerita</label><textarea name="isi" required /></FormAksi>

    <h2 style={{ margin: '26px 0 10px' }}>Divisi</h2>
    {divisi.map(d => <div key={d.id} className="form"><FormAksi aksi={simpanDivisi} tombol="Simpan" kecil reset={false}>
      <input type="hidden" name="id" value={d.id} />
      <div className="grid"><div><label>Nama</label><input name="nama" defaultValue={d.nama} required /></div><div><label>Kode</label><input name="kode" defaultValue={d.kode || ''} /></div>
        <div><label>Ikon</label><select name="ikon" defaultValue={d.ikon}>{IKON.map(k => <option key={k}>{k}</option>)}</select></div><div><label>Urutan</label><input name="urut" type="number" defaultValue={d.urut} /></div></div>
      <label>Deskripsi</label><textarea name="isi" defaultValue={d.isi || ''} /></FormAksi>
      <TombolAksi aksi={hapusDivisi} data={{ id: d.id }} ikon="trash" teks="Hapus" cls="kecil bahaya" konfirmasi="Hapus divisi ini?" /></div>)}
    <FormAksi aksi={simpanDivisi} className="form" tombol="Tambah Divisi"><h2>Tambah divisi</h2>
      <div className="grid"><div><label>Nama</label><input name="nama" required /></div><div><label>Kode</label><input name="kode" /></div>
        <div><label>Ikon</label><select name="ikon">{IKON.map(k => <option key={k}>{k}</option>)}</select></div><div><label>Urutan</label><input name="urut" type="number" defaultValue={divisi.length + 1} /></div></div>
      <label>Deskripsi</label><textarea name="isi" /></FormAksi>

    <h2 style={{ margin: '26px 0 10px' }}>Alur kaderisasi</h2>
    {kader.map(k => <div key={k.id} className="form"><FormAksi aksi={simpanKaderisasi} tombol="Simpan" kecil reset={false}>
      <input type="hidden" name="id" value={k.id} />
      <div className="grid"><div><label>Tahap</label><input name="tahap" defaultValue={k.tahap} required /></div><div><label>Urutan</label><input name="urut" type="number" defaultValue={k.urut} /></div></div>
      <label>Keterangan</label><input name="isi" defaultValue={k.isi || ''} />
      <label>Sub-tahap (satu per baris, opsional)</label><textarea name="sub" defaultValue={(k.sub || []).join('\n')} /></FormAksi>
      <TombolAksi aksi={hapusKaderisasi} data={{ id: k.id }} ikon="trash" teks="Hapus" cls="kecil bahaya" konfirmasi="Hapus tahap ini?" /></div>)}
    <FormAksi aksi={simpanKaderisasi} className="form" tombol="Tambah Tahap"><h2>Tambah tahap</h2>
      <div className="grid"><div><label>Tahap</label><input name="tahap" required /></div><div><label>Urutan</label><input name="urut" type="number" defaultValue={kader.length + 1} /></div></div>
      <label>Keterangan</label><input name="isi" /><label>Sub-tahap (satu per baris)</label><textarea name="sub" /></FormAksi>
  </Shell>)
}
