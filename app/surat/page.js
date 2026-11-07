import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { urlArsip, tautanBerkas } from '@/lib/berkas'
import { tgl, hariIni, KATEGORI_SURAT } from '@/lib/format'
import { simpanSurat, pasangBerkas, hapusSurat } from './actions'
export const dynamic = 'force-dynamic'

export default async function Surat({ searchParams }) {
  const saya = await wajibMasuk('lihat')
  const kelola = boleh(saya, 'surat')
  const arah = ['keluar', 'masuk'].includes(searchParams.arah) ? searchParams.arah : ''
  const kat = KATEGORI_SURAT[searchParams.kategori] ? searchParams.kategori : ''
  const tahun = /^\d{4}$/.test(searchParams.tahun || '') ? searchParams.tahun : ''
  const cari = String(searchParams.q || '').replace(/[%_\\,()]/g, '').slice(0, 60)
  const adm = admin()
  let q = adm.from('surat_arsip').select('*, kegiatan:kegiatan_rab(nama)').order('tanggal', { ascending: false }).order('created_at', { ascending: false }).limit(300)
  if (arah) q = q.eq('arah', arah); if (kat) q = q.eq('kategori', kat)
  if (tahun) q = q.gte('tanggal', `${tahun}-01-01`).lte('tanggal', `${tahun}-12-31`)
  if (cari) q = q.or(`perihal.ilike.%${cari}%,nomor.ilike.%${cari}%,pihak.ilike.%${cari}%`)
  const [daftar, kegiatan] = await Promise.all([q.then(ambil), adm.from('kegiatan_rab').select('id,nama').order('created_at', { ascending: false }).then(ambil)])
  const url = await urlArsip(daftar.map(s => s.file_path))
  return (<Shell aktif="surat" judul="Arsip Surat">
    <form className="baris" style={{ alignItems: 'end' }}>
      <div><label>Arah</label><select name="arah" defaultValue={arah}><option value="">Semua</option><option value="keluar">Keluar</option><option value="masuk">Masuk</option></select></div>
      <div><label>Jenis</label><select name="kategori" defaultValue={kat}><option value="">Semua</option>{Object.entries(KATEGORI_SURAT).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
      <div><label>Tahun</label><input name="tahun" defaultValue={tahun} placeholder="2026" style={{ width: 90 }} /></div>
      <div style={{ flex: 1, minWidth: 180 }}><label>Cari</label><input name="q" defaultValue={cari} placeholder="nomor, perihal, pihak" /></div>
      <button>Terapkan</button>
    </form>

    {kelola && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Arsipkan Surat</summary>
      <FormAksi aksi={simpanSurat} className="form" tombol="Simpan ke Arsip">
        <div className="grid">
          <div><label>Arah</label><select name="arah"><option value="keluar">Surat keluar</option><option value="masuk">Surat masuk</option></select></div>
          <div><label>Jenis surat</label><select name="kategori">{Object.entries(KATEGORI_SURAT).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
          <div><label>Tanggal surat</label><input type="date" name="tanggal" defaultValue={hariIni()} required /></div>
          <div><label>Nomor surat (kosongkan = otomatis)</label><input name="nomor" maxLength={80} placeholder="otomatis untuk surat keluar" /></div>
        </div>
        <label>Perihal</label><input name="perihal" required maxLength={200} />
        <div className="grid">
          <div><label>Tujuan / asal surat</label><input name="pihak" maxLength={120} /></div>
          <div><label>Terkait kegiatan (opsional)</label><select name="kegiatan_id"><option value="">-</option>{kegiatan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></div>
        </div>
        <label>Ringkasan (opsional)</label><textarea name="ringkasan" maxLength={500} />
        <UnggahBerkas name="file" folder="surat" drive label="Berkas surat (opsional)" bantuan="Contoh: proposal Mabim, surat undangan. File disimpan di Storage/Drive, bukan di database." />
      </FormAksi></details>}

    <div className="tabel"><table>
      <thead><tr><th>Nomor</th><th>Tanggal</th><th>Arah</th><th>Jenis</th><th>Perihal</th><th>Tujuan / asal</th><th>Berkas</th>{kelola && <th></th>}</tr></thead>
      <tbody>
        {daftar.length === 0 && <tr><td colSpan={8} className="kosong">Belum ada surat di arsip.</td></tr>}
        {daftar.map(s => (<tr key={s.id}>
          <td><b>{s.nomor}</b></td><td>{tgl(s.tanggal)}</td>
          <td><span className={`lencana ${s.arah === 'keluar' ? 'biru' : 'kuning'}`}>{s.arah}</span></td><td>{KATEGORI_SURAT[s.kategori]}</td>
          <td className="bungkus">{s.perihal}{s.kegiatan && <small><br />Kegiatan: {s.kegiatan.nama}</small>}</td><td>{s.pihak || '-'}</td>
          <td>{tautanBerkas(s.file_url, s.file_path, url) ? <><a className="btn kecil" href={tautanBerkas(s.file_url, s.file_path, url)} target="_blank" rel="noreferrer"><i className={`bi bi-${s.file_url ? 'google' : 'file-earmark-pdf'}`} /> Buka</a>{s.file_ukuran > 0 && <small style={{ marginLeft: 6 }}>{(s.file_ukuran / 1048576).toFixed(1)} MB</small>}</>
            : kelola ? <details><summary className="btn kecil abu" style={{ listStyle: 'none' }}>Unggah</summary>
              <FormAksi aksi={pasangBerkas} tombol="Pasang" kecil><input type="hidden" name="id" value={s.id} /><UnggahBerkas name="file" folder="surat" drive label="Berkas" /></FormAksi></details> : '-'}</td>
          {kelola && <td><TombolAksi aksi={hapusSurat} data={{ id: s.id }} ikon="trash" cls="kecil bahaya" konfirmasi="Hapus surat ini dari arsip? Nomornya tidak dipakai ulang." /></td>}
        </tr>))}
      </tbody></table></div>
  </Shell>)
}
