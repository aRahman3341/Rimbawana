import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { urlArsip, urlFoto } from '@/lib/berkas'
import { rupiah, bulanTahun, daftarBulan, awalBulan, hariIni } from '@/lib/format'
import { bayarKas, catatTunai, verifikasiKas, simpanPengaturanKas } from './actions'
export const dynamic = 'force-dynamic'

export default async function Kas() {
  const saya = await wajibMasuk()
  const uang = boleh(saya, 'uang'), lihat = boleh(saya, 'pengurus')
  const adm = admin()
  const cfg = Object.fromEntries(ambil(await adm.from('rmb_pengaturan').select('*')).map(r => [r.kunci, r.nilai]))
  const nominal = Number(cfg.kas_nominal || 25000), mulai = cfg.kas_mulai || awalBulan()
  const bulan = daftarBulan(mulai)
  const [saku, antrian, tunggak, anggota] = await Promise.all([
    adm.from('kas_iuran').select('periode,status,catatan').eq('anggota_id', saya.id).then(ambil),
    lihat ? adm.from('kas_iuran').select('id,periode,jumlah,bukti_path,created_at, anggota:anggota!anggota_id(nama_adat)').eq('status', 'menunggu').order('created_at').then(ambil) : [],
    lihat ? adm.from('v_tunggakan').select('anggota_id,nama_adat,periode,nominal').then(ambil) : [],
    uang ? adm.from('anggota').select('id,nama_adat').eq('aktif', true).neq('jabatan', 'alumni').order('nama_adat').then(ambil) : []])
  const url = await urlArsip(antrian.map(a => a.bukti_path))
  const status = (b) => { const r = saku.filter(x => x.periode === b); return r.find(x => x.status === 'terverifikasi') ? 'lunas' : r.find(x => x.status === 'menunggu') ? 'menunggu' : 'belum' }
  const belum = bulan.filter(b => status(b) === 'belum')
  const per = {}; tunggak.forEach(t => { (per[t.anggota_id] ||= { nama: t.nama_adat, bln: [] }).bln.push(t.periode) })
  const penunggak = Object.values(per).sort((a, b) => b.bln.length - a.bln.length)
  return (<Shell aktif="kas" judul="Kas Anggota">
    <div className="dua">
      <div className="form">
        <h2>Kas saya</h2>
        <p className="redup" style={{ margin: '0 0 10px' }}>Iuran {rupiah(nominal)} per bulan, mulai {bulanTahun(mulai)}.</p>
        {bulan.length === 0 ? <p className="kosong">Belum ada tagihan.</p> : <div className="baris" style={{ gap: 8 }}>
          {bulan.map(b => { const s = status(b); return <span key={b} className={`lencana ${s === 'lunas' ? 'hijau' : s === 'menunggu' ? 'kuning' : 'merah'}`}>{bulanTahun(b)}: {s}</span> })}</div>}
        {belum.length > 0 ? (
          <FormAksi aksi={bayarKas} tombol="Kirim Pembayaran" className="" >
            <label>Bulan yang dibayar</label>
            {belum.map(b => <label key={b} style={{ fontWeight: 400, margin: '4px 0' }}><input type="checkbox" name="periode" value={b} style={{ marginRight: 8 }} />{bulanTahun(b)} ({rupiah(nominal)})</label>)}
            <p style={{ margin: '10px 0 4px' }}>Scan QRIS di samping, lalu unggah bukti pembayaran:</p>
            <UnggahBerkas name="bukti" folder="kas" accept="image/png,image/jpeg,image/webp,application/pdf" label="Bukti pembayaran" />
          </FormAksi>) : bulan.length > 0 && <p className="ok">Semua kas sudah terbayar atau menunggu verifikasi. Terima kasih!</p>}
      </div>
      <div className="form">
        <h2>Bayar dengan QRIS</h2>
        {cfg.qris_path ? <img className="qris" src={urlFoto(cfg.qris_path)} alt="QRIS Rimbawana" /> : <p className="kosong">QRIS belum dipasang bendahara.</p>}
      </div>
    </div>

    {lihat && <>
      <h2 style={{ margin: '24px 0 10px' }}>Menunggu verifikasi ({antrian.length})</h2>
      <div className="tabel"><table><thead><tr><th>Anggota</th><th>Bulan</th><th className="angka">Jumlah</th><th>Bukti</th>{uang && <th></th>}</tr></thead><tbody>
        {antrian.length === 0 && <tr><td colSpan={5} className="kosong">Tidak ada pembayaran yang menunggu.</td></tr>}
        {antrian.map(a => <tr key={a.id}><td><b>{a.anggota?.nama_adat}</b></td><td>{bulanTahun(a.periode)}</td><td className="angka">{rupiah(a.jumlah)}</td>
          <td>{url[a.bukti_path] ? <a href={url[a.bukti_path]} target="_blank" rel="noreferrer">Lihat bukti</a> : '-'}</td>
          {uang && <td><TombolAksi aksi={verifikasiKas} data={{ id: a.id, setuju: '1' }} ikon="check-lg" teks="Terima" konfirmasi="Terima pembayaran ini?" />{' '}
            <TombolAksi aksi={verifikasiKas} data={{ id: a.id, setuju: '0' }} ikon="x-lg" cls="kecil bahaya" konfirmasi="Tolak pembayaran ini?" /></td>}</tr>)}
      </tbody></table></div>

      <h2 style={{ margin: '24px 0 10px' }}>Penunggak kas ({penunggak.length})</h2>
      <div className="tabel"><table><thead><tr><th>Anggota</th><th className="angka">Bulan</th><th className="angka">Total tunggakan</th><th>Rincian</th></tr></thead><tbody>
        {penunggak.length === 0 && <tr><td colSpan={4} className="kosong">Tidak ada tunggakan.</td></tr>}
        {penunggak.map(p => <tr key={p.nama}><td><b>{p.nama}</b></td><td className="angka">{p.bln.length}</td><td className="angka">{rupiah(p.bln.length * nominal)}</td>
          <td className="bungkus">{p.bln.sort().map(bulanTahun).join(', ')}</td></tr>)}
      </tbody></table></div></>}

    {uang && <div className="dua" style={{ marginTop: 24 }}>
      <FormAksi aksi={catatTunai} className="form" tombol="Catat Kas Tunai"><h2>Catat kas tunai</h2>
        <label>Anggota</label><select name="anggota_id" required><option value="">-</option>{anggota.map(a => <option key={a.id} value={a.id}>{a.nama_adat}</option>)}</select>
        <label>Bulan</label><input type="month" name="bulan" defaultValue={hariIni().slice(0, 7)} required /></FormAksi>
      <FormAksi aksi={simpanPengaturanKas} className="form" tombol="Simpan Pengaturan" reset={false}><h2>Pengaturan kas</h2>
        <div className="grid"><div><label>Nominal per bulan (Rp)</label><input name="nominal" inputMode="numeric" defaultValue={nominal} /></div>
          <div><label>Mulai tagihan</label><input type="date" name="mulai" defaultValue={mulai} /></div></div>
        <UnggahBerkas name="qris" bucket="foto" folder="qris" accept="image/png,image/jpeg,image/webp" label="Gambar QRIS (ganti jika perlu)" /></FormAksi>
    </div>}
  </Shell>)
}
