import Link from 'next/link'
import { notFound } from 'next/navigation'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { tgl, hariIni, waLink, TIPE_PINJAM, STATUS_PINJAM } from '@/lib/format'
import { serahkanAksi, tolakAksi, kembaliAksi } from '../actions'
export const dynamic = 'force-dynamic'

export default async function DetailPinjam({ params }) {
  const saya = await wajibMasuk('lihatInv')
  const bisa = boleh(saya, 'inventaris')
  const adm = admin()
  const p = ambil(await adm.from('pinjam').select('*, mapala:mapala_mitra(nama,kontak_nama,kontak_hp), proses:anggota!diproses_oleh(nama_adat)').eq('id', params.id).maybeSingle())
  if (!p) notFound()
  const [items, unit, surat] = await Promise.all([
    adm.from('pinjam_item').select('jumlah, jenis:barang_jenis(nama,divisi)').eq('pinjam_id', p.id).then(ambil),
    adm.from('pinjam_unit').select('kondisi_kembali, unit:barang_unit(id,nomor,kondisi, jenis:barang_jenis(nama))').eq('pinjam_id', p.id).then(ambil),
    adm.from('surat_arsip').select('id,nomor,perihal').eq('pinjam_id', p.id).then(ambil)])
  const [w, lb] = STATUS_PINJAM[p.status]
  const telat = p.status === 'dipinjam' && p.tgl_rencana_kembali < hariIni()
  const wa = waLink(p.peminjam_hp || p.mapala?.kontak_hp)
  return (<Shell aktif="peminjaman" judul={p.kode}>
    <div className="baris"><Link className="btn kecil abu" href="/peminjaman"><i className="bi bi-arrow-left" /> Kembali</Link>
      <span className={`lencana ${w}`}>{lb}</span>{telat && <span className="lencana merah">Terlambat</span>}<span className="lencana coklat">{TIPE_PINJAM[p.tipe]}</span></div>
    <div className="dua">
      <div className="form">
        <h2>Data peminjaman</h2>
        <p><b>{p.tipe === 'anggota' ? p.peminjam_nama : p.mapala?.nama}</b>{p.peminjam_adat && ` (${p.peminjam_adat})`}</p>
        {wa && <p><a href={wa} target="_blank" rel="noreferrer"><i className="bi bi-whatsapp" /> Hubungi via WhatsApp</a></p>}
        <p>Pinjam: {tgl(p.tgl_pinjam)} &middot; Rencana kembali: {tgl(p.tgl_rencana_kembali)}{p.tgl_kembali && <> &middot; Kembali: {tgl(p.tgl_kembali)}</>}</p>
        {p.keperluan && <p>Keperluan: {p.keperluan}</p>}
        {p.catatan && <p>Catatan: {p.catatan}</p>}
        {p.proses && <p className="redup">Diproses oleh {p.proses.nama_adat}</p>}
        {surat.map(s => <p key={s.id}><i className="bi bi-envelope-paper" /> Surat: <b>{s.nomor}</b> <Link href="/surat">(lihat arsip)</Link></p>)}
        <h2 style={{ marginTop: 14 }}>Barang diminta</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>{items.map((i, n) => <li key={n}>{i.jenis.nama} x{i.jumlah}</li>)}</ul>
      </div>

      <div>
        {bisa && p.status === 'menunggu' && <>
          <FormAksi aksi={serahkanAksi} className="form" tombol="Setujui & Serahkan Alat" reset={false}>
            <h2>Proses permintaan</h2><input type="hidden" name="id" value={p.id} />
            <p className="redup" style={{ margin: 0 }}>Unit layak dan tersedia dipilih otomatis lalu ditandai Dipinjam.</p></FormAksi>
          <FormAksi aksi={tolakAksi} className="form" tombol="Tolak" bahaya reset={false}>
            <input type="hidden" name="id" value={p.id} /><label>Alasan penolakan</label><input name="catatan" maxLength={200} /></FormAksi></>}

        {bisa && p.status === 'dipinjam' && <FormAksi aksi={kembaliAksi} className="form" tombol="Tandai Dikembalikan" reset={false}>
          <h2>{p.tipe === 'kita_pinjam' ? 'Kembalikan ke mapala pemilik' : 'Pengembalian alat'}</h2><input type="hidden" name="id" value={p.id} />
          {p.tipe !== 'kita_pinjam' && <p className="redup" style={{ margin: '0 0 6px' }}>Periksa kondisi tiap unit saat kembali.</p>}
          {unit.map(u => <div key={u.unit.id} className="baris" style={{ marginBottom: 6 }}>
            <span style={{ flex: 1 }}><b>{u.unit.nomor}</b> <small>{u.unit.jenis.nama}</small></span>
            {p.tipe !== 'kita_pinjam' && <select name={`k_${u.unit.id}`} defaultValue={u.unit.kondisi} style={{ width: 150 }}><option value="layak">Layak pakai</option><option value="tidak_layak">Tidak layak</option></select>}</div>)}
        </FormAksi>}

        {p.status !== 'menunggu' && unit.length > 0 && <div className="form"><h2>Unit terkait</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>{unit.map(u => <li key={u.unit.id}><b>{u.unit.nomor}</b> {u.unit.jenis.nama}{u.kondisi_kembali && <> - kembali: {u.kondisi_kembali === 'layak' ? 'layak' : 'tidak layak'}</>}</li>)}</ul></div>}
      </div>
    </div>
  </Shell>)
}
