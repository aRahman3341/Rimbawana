import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { tgl } from '@/lib/format'
import { buatArahan, tanggapiArahan, bukaLagiArahan, hapusArahan } from './actions'
export const dynamic = 'force-dynamic'

const ST = { baru: ['kuning', 'Baru'], dikerjakan: ['biru', 'Dikerjakan'], selesai: ['hijau', 'Selesai'] }
export default async function Pengawasan({ searchParams }) {
  const saya = await wajibMasuk('lihat')
  const bpr = boleh(saya, 'arahan'), pengurus = boleh(saya, 'pengurus')
  const st = ST[searchParams.status] ? searchParams.status : ''
  const adm = admin()
  let q = adm.from('arahan_bpr').select('*, kegiatan:kegiatan_rab(id,nama), penulis:anggota!dibuat_oleh(nama_adat), penanggap:anggota!ditanggapi_oleh(nama_adat)').order('created_at', { ascending: false }).limit(200)
  if (st) q = q.eq('status', st)
  const [daftar, kegiatan] = await Promise.all([q.then(ambil), bpr ? adm.from('kegiatan_rab').select('id,nama').order('created_at', { ascending: false }).then(ambil) : []])
  return (<Shell aktif="pengawasan" judul="Pengawasan BPR">
    <p className="redup" style={{ marginTop: 0 }}>Badan Pengawas Rimbawana (BPR) mengawasi dan memberi arahan. Pengurus menanggapi dan menandai progres di sini.</p>
    {bpr && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Beri Arahan</summary>
      <FormAksi aksi={buatArahan} className="form" tombol="Kirim Arahan">
        <label>Judul</label><input name="judul" required maxLength={120} />
        <label>Terkait kegiatan (opsional)</label><select name="kegiatan_id"><option value="">-</option>{kegiatan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select>
        <label>Isi arahan</label><textarea name="isi" required maxLength={1500} />
      </FormAksi></details>}
    <div className="tabs"><Link className={`tab ${!st ? 'aktif' : ''}`} href="/pengawasan">Semua</Link>
      {Object.entries(ST).map(([k, [, t]]) => <Link key={k} className={`tab ${st === k ? 'aktif' : ''}`} href={`/pengawasan?status=${k}`}>{t}</Link>)}</div>
    {daftar.length === 0 && <p className="kosong">Belum ada arahan.</p>}
    <div className="dua">
      {daftar.map(a => { const [w, lb] = ST[a.status]
        return (<div className="form" key={a.id} style={{ margin: 0 }}>
          <div className="baris" style={{ marginBottom: 6 }}><span className={`lencana ${w}`}>{lb}</span>
            {a.kegiatan && <Link className="lencana coklat" href={`/kegiatan/${a.kegiatan.id}`} style={{ textDecoration: 'none' }}>{a.kegiatan.nama}</Link>}
            <small className="ms-auto">{a.penulis?.nama_adat || 'BPR'} &middot; {tgl(a.created_at)}</small></div>
          <h2 style={{ margin: '0 0 6px' }}>{a.judul}</h2><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{a.isi}</p>
          {a.tanggapan && <p style={{ margin: '10px 0 0', padding: '8px 12px', background: 'var(--embun)', borderRadius: 10 }}><b>Tanggapan{a.penanggap ? ` (${a.penanggap.nama_adat})` : ''}:</b> {a.tanggapan}</p>}
          {pengurus && a.status !== 'selesai' && <FormAksi aksi={tanggapiArahan} tombol="Kirim Tanggapan" kecil reset={false}>
            <input type="hidden" name="id" value={a.id} />
            <label>Tanggapan</label><input name="tanggapan" defaultValue={a.tanggapan || ''} maxLength={500} />
            <label>Status</label><select name="status" defaultValue={a.status === 'baru' ? 'dikerjakan' : a.status}><option value="dikerjakan">Sedang dikerjakan</option><option value="selesai">Selesai</option></select></FormAksi>}
          {bpr && <div style={{ margin: '10px 0 0' }}>{a.status === 'selesai' && <TombolAksi aksi={bukaLagiArahan} data={{ id: a.id }} teks="Buka lagi" cls="kecil abu" />}{' '}
            <TombolAksi aksi={hapusArahan} data={{ id: a.id }} ikon="trash" cls="kecil bahaya" konfirmasi="Hapus arahan ini?" /></div>}
        </div>) })}
    </div>
  </Shell>)
}
