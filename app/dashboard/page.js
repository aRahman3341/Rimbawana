import Link from 'next/link'
import Shell from '@/components/Shell'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { rupiah, tgl, hariIni, tambahHari, waLink } from '@/lib/format'
import { daftarRuang } from '@/lib/chat'
import { getLogo } from '@/lib/profil'
export const dynamic = 'force-dynamic'

const Kartu = ({ href, ikon, n, t, kelas = '', kecil }) => {
  const isi = <><i className={`bi bi-${ikon}`} /><div><h3 style={kecil ? { fontSize: '1.25rem' } : undefined}>{n}</h3><span>{t}</span></div></>
  return href ? <Link href={href} className={`info ${kelas}`}>{isi}</Link> : <div className={`info ${kelas}`}>{isi}</div>
}

export default async function Dashboard() {
  const saya = await wajibMasuk()
  const adm = admin(), hari = hariIni(), logo = await getLogo()
  const pengurus = boleh(saya, 'lihat'), inv = boleh(saya, 'lihatInv'), ketua = boleh(saya, 'keputusan')
  const ruangIds = (await daftarRuang(adm, saya)).map(r => r.id)
  const permintaanBaru = saya.peran === 'founder' ? await adm.from('akses_permintaan').select('id', { count: 'exact', head: true }).eq('status', 'baru').then(r => r.count || 0) : 0
  const [anggota, stok, menunggu, telat, kasSaya, buku, tunggak, rab, pinjaman, arahan, rapat] = await Promise.all([
    adm.from('anggota').select('id', { count: 'exact', head: true }).eq('aktif', true).neq('jabatan', 'alumni').neq('peran', 'founder').then(r => r.count || 0),
    adm.from('v_stok_jenis').select('total,tersedia,dipinjam,tidak_layak').then(ambil),
    inv ? adm.from('pinjam').select('id', { count: 'exact', head: true }).eq('status', 'menunggu').then(r => r.count || 0) : 0,
    inv ? adm.from('pinjam').select('id,kode,peminjam_nama,peminjam_hp,tgl_rencana_kembali, mapala:mapala_mitra(nama)').eq('status', 'dipinjam').lte('tgl_rencana_kembali', tambahHari(2)).order('tgl_rencana_kembali').limit(8).then(ambil) : [],
    adm.from('v_tunggakan').select('periode').eq('anggota_id', saya.id).then(ambil),
    pengurus ? adm.from('buku_kas').select('tipe,jumlah').then(ambil) : [],
    pengurus ? adm.from('v_tunggakan').select('anggota_id').then(ambil) : [],
    ketua ? adm.from('kegiatan_rab').select('id', { count: 'exact', head: true }).eq('status_rab', 'diajukan').then(r => r.count || 0) : 0,
    inv ? adm.from('barang_unit').select('nomor,batas_kembali, jenis:barang_jenis(nama), pemilik:mapala_mitra(nama)').not('pemilik_mapala_id', 'is', null).neq('status', 'nonaktif').lte('batas_kembali', tambahHari(3)).order('batas_kembali').limit(8).then(ambil) : [],
    pengurus ? adm.from('arahan_bpr').select('id', { count: 'exact', head: true }).neq('status', 'selesai').then(r => r.count || 0) : 0,
    ruangIds.length ? adm.from('chat_pesan').select('id,ruang_id,meet_judul,meet_url,meet_waktu, ruang:chat_ruang(nama)').eq('jenis', 'meet').eq('dihapus', false).in('ruang_id', ruangIds).gte('meet_waktu', new Date(Date.now() - 3 * 3600e3).toISOString()).order('meet_waktu').limit(3).then(ambil) : []])
  const s = (k) => stok.reduce((a, x) => a + Number(x[k]), 0)
  const saldo = buku.reduce((a, t) => a + (t.tipe === 'masuk' ? 1 : -1) * Number(t.jumlah), 0)
  const penunggak = new Set(tunggak.map(t => t.anggota_id)).size

  return (<Shell aktif="dashboard" judul="Dashboard">
    <div className="form" style={{ marginBottom: 18, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <img src={logo} alt="" style={{ height: 54 }} />
      <div style={{ flex: 1 }}><h2 style={{ margin: 0, fontSize: '1.25rem' }}>Selamat datang, {saya.nama_adat}</h2><span className="redup">Pusat inventaris, surat, dan keuangan UKM Rimbawana.</span></div>
      <Link className="btn kuning kecil" href="/">Lihat situs publik</Link>
    </div>
    <div className="cards">
      {saya.peran === 'founder' && <Kartu href="/akses" ikon="headset" n={permintaanBaru} t="Permintaan CS Founder baru" kelas={permintaanBaru ? 'api' : ''} />}
      <Kartu href="/anggota" ikon="people" n={anggota} t="Anggota aktif" />
      <Kartu href="/barang" ikon="box-seam" n={`${s('tersedia')} / ${s('total')}`} t="Unit tersedia / total" kelas="biru" />
      <Kartu href="/barang" ikon="arrow-left-right" n={s('dipinjam')} t="Sedang dipinjam" kelas="api" />
      <Kartu href="/barang" ikon="exclamation-triangle" n={s('tidak_layak')} t="Tidak layak pakai" kelas="merah" />
      {inv && <Kartu href="/peminjaman?status=menunggu" ikon="inbox" n={menunggu} t="Permintaan pinjam menunggu" kelas={menunggu ? 'api' : ''} />}
      {pengurus && <Kartu href="/keuangan" ikon="wallet2" n={rupiah(saldo)} t="Saldo kas" kecil />}
      {pengurus && <Kartu href="/kas" ikon="person-exclamation" n={penunggak} t="Anggota menunggak kas" kelas={penunggak ? 'merah' : ''} />}
      {pengurus && <Kartu href="/pengawasan" ikon="binoculars" n={arahan} t="Arahan BPR belum selesai" kelas={arahan ? 'api' : ''} />}
      {ketua && <Kartu href="/kegiatan" ikon="clipboard-check" n={rab} t="RAB menunggu ACC" kelas={rab ? 'api' : ''} />}
      <Kartu href="/kas" ikon="piggy-bank" n={kasSaya.length ? `${kasSaya.length} bulan` : 'Lunas'} t="Tunggakan kas saya" kelas={kasSaya.length ? 'merah' : ''} />
    </div>

    {rapat.length > 0 && <div style={{ marginBottom: 18 }}><h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Rapat online mendatang</h2>
      <div className="cards">{rapat.map(m => <div key={m.id} className="info biru"><i className="bi bi-camera-video" /><div><b>{m.meet_judul || 'Rapat online'}</b><br /><span>{new Date(m.meet_waktu).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB &middot; {m.ruang?.nama}</span><br /><a href={m.meet_url} target="_blank" rel="noreferrer">Gabung Meet</a></div></div>)}</div></div>}

    {inv && (telat.length > 0 || pinjaman.length > 0) && <div className="dua">
      {telat.length > 0 && <div><h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Jatuh tempo pengembalian</h2>
        <div className="tabel"><table><tbody>{telat.map(p => <tr key={p.id}><td><Link href={`/peminjaman/${p.id}`}><b>{p.kode}</b></Link></td><td>{p.peminjam_nama || p.mapala?.nama}{waLink(p.peminjam_hp) && <> <a href={waLink(p.peminjam_hp)} target="_blank" rel="noreferrer"><i className="bi bi-whatsapp" /></a></>}</td>
          <td><span className={`lencana ${p.tgl_rencana_kembali < hari ? 'merah' : 'kuning'}`}>{p.tgl_rencana_kembali < hari ? 'Terlambat' : 'Segera'} {tgl(p.tgl_rencana_kembali)}</span></td></tr>)}</tbody></table></div></div>}
      {pinjaman.length > 0 && <div><h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Alat pinjaman dari mapala lain</h2>
        <div className="tabel"><table><tbody>{pinjaman.map(u => <tr key={u.nomor}><td><b>{u.jenis?.nama}</b><br /><small>{u.nomor}</small></td><td>{u.pemilik?.nama}</td>
          <td><span className={`lencana ${u.batas_kembali < hari ? 'merah' : 'kuning'}`}>Kembali {tgl(u.batas_kembali)}</span></td></tr>)}</tbody></table></div></div>}
    </div>}
  </Shell>)
}
