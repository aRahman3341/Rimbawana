import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { urlArsip } from '@/lib/berkas'
import { rupiah, tgl, hariIni, akhirBulan, KATEGORI_KAS } from '@/lib/format'
import { tambahTransaksi, hapusTransaksi } from './actions'
export const dynamic = 'force-dynamic'

export default async function Keuangan({ searchParams }) {
  const saya = await wajibMasuk('pengurus')
  const uang = boleh(saya, 'uang')
  const bln = /^\d{4}-\d{2}$/.test(searchParams.bulan || '') ? searchParams.bulan : ''
  const adm = admin()
  const semua = ambil(await adm.from('buku_kas').select('tipe,kategori,jumlah'))
  let q = adm.from('buku_kas').select('*, kegiatan:kegiatan_rab(nama)').order('tanggal', { ascending: false }).order('created_at', { ascending: false }).limit(300)
  if (bln) q = q.gte('tanggal', `${bln}-01`).lte('tanggal', akhirBulan(bln))
  const [daftar, kegiatan] = await Promise.all([q.then(ambil), uang ? adm.from('kegiatan_rab').select('id,nama,status_rab').order('created_at', { ascending: false }).then(ambil) : []])
  const url = await urlArsip(daftar.map(t => t.bukti_path))
  const jml = (f) => semua.filter(f).reduce((a, t) => a + Number(t.jumlah), 0)
  const masuk = jml(t => t.tipe === 'masuk'), keluar = jml(t => t.tipe === 'keluar')
  return (<Shell aktif="keuangan" judul="Buku Kas">
    <div className="cards">
      <div className="info"><i className="bi bi-wallet2" /><div><h3 style={{ fontSize: '1.35rem' }}>{rupiah(masuk - keluar)}</h3><span>Saldo saat ini</span></div></div>
      <div className="info biru"><i className="bi bi-arrow-down-circle" /><div><h3 style={{ fontSize: '1.35rem' }}>{rupiah(masuk)}</h3><span>Total pemasukan</span></div></div>
      <div className="info merah"><i className="bi bi-arrow-up-circle" /><div><h3 style={{ fontSize: '1.35rem' }}>{rupiah(keluar)}</h3><span>Total pengeluaran</span></div></div>
      <div className="info api"><i className="bi bi-piggy-bank" /><div><h3 style={{ fontSize: '1.35rem' }}>{rupiah(jml(t => t.kategori === 'kas' && t.tipe === 'masuk'))}</h3><span>Kas anggota terkumpul</span></div></div>
    </div>

    {uang && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Catat Transaksi</summary>
      <FormAksi aksi={tambahTransaksi} className="form" tombol="Simpan Transaksi">
        <div className="grid">
          <div><label>Jenis</label><select name="tipe"><option value="keluar">Pengeluaran</option><option value="masuk">Pemasukan</option></select></div>
          <div><label>Kategori</label><select name="kategori">{Object.entries(KATEGORI_KAS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
          <div><label>Tanggal</label><input type="date" name="tanggal" defaultValue={hariIni()} required /></div>
          <div><label>Jumlah (Rp)</label><input name="jumlah" inputMode="numeric" required /></div>
          <div><label>Kegiatan (opsional)</label><select name="kegiatan_id"><option value="">-</option>{kegiatan.map(k => <option key={k.id} value={k.id}>{k.nama}{k.status_rab !== 'disetujui' ? ' (RAB belum disetujui)' : ''}</option>)}</select></div>
        </div>
        <label>Keterangan</label><input name="keterangan" maxLength={200} />
        <UnggahBerkas name="bukti" folder="bukti" accept="image/png,image/jpeg,image/webp,application/pdf" label="Bukti / nota (opsional)" />
        <p className="redup" style={{ margin: '8px 0 0' }}>Kas anggota masuk otomatis lewat verifikasi di menu Kas Anggota. Pengeluaran kegiatan hanya bisa untuk kegiatan yang RAB-nya sudah disetujui.</p>
      </FormAksi></details>}

    <form className="baris"><label style={{ margin: 0 }}>Bulan</label><input type="month" name="bulan" defaultValue={bln} style={{ width: 170 }} /><button>Tampilkan</button>{bln && <Link href="/keuangan">Semua</Link>}</form>
    <div className="tabel"><table>
      <thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Keterangan</th><th className="angka">Jumlah</th><th>Bukti</th>{uang && <th></th>}</tr></thead>
      <tbody>
        {daftar.length === 0 && <tr><td colSpan={7} className="kosong">Belum ada transaksi.</td></tr>}
        {daftar.map(t => <tr key={t.id}><td>{tgl(t.tanggal)}</td><td><span className={`lencana ${t.tipe === 'masuk' ? 'hijau' : 'merah'}`}>{t.tipe}</span></td><td>{KATEGORI_KAS[t.kategori] || 'Kas anggota'}</td>
          <td className="bungkus">{t.keterangan || '-'}{t.kegiatan && <small><br />Kegiatan: {t.kegiatan.nama}</small>}</td>
          <td className="angka"><b>{t.tipe === 'keluar' ? '-' : '+'}{rupiah(t.jumlah)}</b></td>
          <td>{url[t.bukti_path] ? <a href={url[t.bukti_path]} target="_blank" rel="noreferrer">Lihat</a> : '-'}</td>
          {uang && <td>{!t.kas_iuran_id && <TombolAksi aksi={hapusTransaksi} data={{ id: t.id }} ikon="trash" cls="kecil bahaya" konfirmasi="Hapus transaksi ini?" />}</td>}</tr>)}
      </tbody></table></div>
  </Shell>)
}
