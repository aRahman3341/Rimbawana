import Link from 'next/link'
import Shell from '@/components/Shell'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { tgl, hariIni, waLink, TIPE_PINJAM, STATUS_PINJAM } from '@/lib/format'
export const dynamic = 'force-dynamic'

const TAB = [['', 'Semua'], ['menunggu', 'Menunggu'], ['dipinjam', 'Dipinjam'], ['dikembalikan', 'Selesai'], ['ditolak', 'Ditolak']]
export default async function Peminjaman({ searchParams }) {
  await wajibMasuk('inventaris')
  const st = STATUS_PINJAM[searchParams.status] ? searchParams.status : ''
  let q = admin().from('pinjam').select('*, mapala:mapala_mitra(nama), items:pinjam_item(jumlah, jenis:barang_jenis(nama))').order('created_at', { ascending: false }).limit(200)
  if (st) q = q.eq('status', st)
  const daftar = ambil(await q), hari = hariIni()
  return (<Shell aktif="peminjaman" judul="Peminjaman">
    <div className="baris"><Link className="btn" href="/peminjaman/baru"><i className="bi bi-plus-lg" /> Catat Peminjaman</Link>
      <span className="redup">Permintaan dari situs publik masuk otomatis dengan status Menunggu.</span></div>
    <div className="tabs">{TAB.map(([k, t]) => <Link key={k} className={`tab ${st === k ? 'aktif' : ''}`} href={k ? `/peminjaman?status=${k}` : '/peminjaman'}>{t}</Link>)}</div>
    <div className="tabel"><table>
      <thead><tr><th>Kode</th><th>Jenis</th><th>Peminjam</th><th>Barang</th><th>Pinjam</th><th>Kembali</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {daftar.length === 0 && <tr><td colSpan={8} className="kosong">Belum ada data.</td></tr>}
        {daftar.map(p => { const [w, lb] = STATUS_PINJAM[p.status]; const telat = p.status === 'dipinjam' && p.tgl_rencana_kembali < hari
          return (<tr key={p.id}>
            <td><b>{p.kode}</b></td><td><span className="lencana coklat">{TIPE_PINJAM[p.tipe]}</span></td>
            <td>{p.tipe === 'anggota' ? <>{p.peminjam_nama}{p.peminjam_adat && <small> ({p.peminjam_adat})</small>}{waLink(p.peminjam_hp) && <> <a href={waLink(p.peminjam_hp)} target="_blank" rel="noreferrer" title="WhatsApp"><i className="bi bi-whatsapp" /></a></>}</> : p.mapala?.nama || '-'}</td>
            <td className="bungkus">{p.items.map(i => `${i.jenis?.nama} x${i.jumlah}`).join(', ')}</td>
            <td>{tgl(p.tgl_pinjam)}</td><td>{tgl(p.tgl_rencana_kembali)}</td>
            <td><span className={`lencana ${w}`}>{lb}</span>{telat && <span className="lencana merah" style={{ marginLeft: 4 }}>Terlambat</span>}</td>
            <td><Link className="btn kecil" href={`/peminjaman/${p.id}`}>Detail</Link></td></tr>) })}
      </tbody></table></div>
  </Shell>)
}
