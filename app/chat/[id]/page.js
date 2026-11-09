import Link from 'next/link'
import { notFound } from 'next/navigation'
import Shell from '@/components/Shell'
import ChatRoom from '@/components/ChatRoom'
import TombolAksi from '@/components/TombolAksi'
import { wajibMasuk } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { aksesRuang, KOLOM_PESAN, bersihPesan, tandaiBaca, kandidatRuang } from '@/lib/chat'
import { PERAN, namaPeran } from '@/lib/akun'
import { tambahAnggotaRuang, keluarkanAnggotaRuang, jadikanAdminRuang, arsipkanRuang, hapusRuang } from '../actions'
export const dynamic = 'force-dynamic'

export default async function Ruang({ params }) {
  const saya = await wajibMasuk('lihat')
  const adm = admin()
  const a = await aksesRuang(adm, saya, params.id)
  if (!a) notFound()
  const { data: terbaru } = await adm.from('chat_pesan').select(KOLOM_PESAN).eq('ruang_id', a.ruang.id).order('id', { ascending: false }).limit(60)
  const awal = (terbaru || []).reverse().map(bersihPesan)
  if (awal.length) await tandaiBaca(adm, saya, a.ruang.id, awal[awal.length - 1].id)
  const khusus = a.ruang.tipe === 'khusus'
  const anggota = khusus ? ambil(await adm.from('chat_anggota').select('anggota_id,admin,anggota:anggota!anggota_id(nama_adat,peran)').eq('ruang_id', a.ruang.id)) : []
  const ada = new Set(anggota.map(m => m.anggota_id))
  const kandidat = a.admin && khusus ? (await kandidatRuang(adm)).filter(k => !ada.has(k.id)) : []
  return (<Shell aktif="chat" judul={a.ruang.nama}>
    <div className="baris"><Link className="btn kecil abu" href="/chat"><i className="bi bi-arrow-left" /> Semua ruang</Link>
      <span className="redup">{a.ruang.deskripsi || (khusus ? `${anggota.length} anggota` : 'Semua pengurus dan BPR')}</span>
      {a.ruang.arsip && <span className="lencana abu">diarsipkan</span>}</div>
    <ChatRoom ruangId={a.ruang.id} sayaId={saya.id} awal={awal} bisaKirim={a.bisaKirim} admin={a.admin} />

    {a.admin && <details className="tambah" style={{ marginTop: 16 }}><summary className="btn abu"><i className="bi bi-gear" /> Atur ruang</summary>
      <div className="form">
        {khusus && <><h2>Anggota ruang</h2>
          <div className="tabel" style={{ marginBottom: 12 }}><table><tbody>
            {anggota.map(m => <tr key={m.anggota_id}><td><b>{m.anggota?.nama_adat}</b> <small>{namaPeran(m.anggota?.peran)}</small></td><td>{m.admin && <span className="lencana biru">admin ruang</span>}</td>
              <td><TombolAksi aksi={jadikanAdminRuang} data={{ ruang_id: a.ruang.id, anggota_id: m.anggota_id, admin: m.admin ? '0' : '1' }} teks={m.admin ? 'Cabut admin' : 'Jadikan admin'} cls="kecil abu" />{' '}
                <TombolAksi aksi={keluarkanAnggotaRuang} data={{ ruang_id: a.ruang.id, anggota_id: m.anggota_id }} ikon="x-lg" cls="kecil bahaya" konfirmasi="Keluarkan dari ruang ini?" /></td></tr>)}
          </tbody></table></div>
          {kandidat.length > 0 && <form action={tambahAnggotaRuang} className="baris"><input type="hidden" name="ruang_id" value={a.ruang.id} />
            <select name="anggota_id" style={{ maxWidth: 260 }}>{kandidat.map(k => <option key={k.id} value={k.id}>{k.nama_adat} ({namaPeran(k.peran)})</option>)}</select><button className="kecil">Tambah anggota</button></form>}</>}
        <div className="baris" style={{ marginTop: 10 }}>
          <TombolAksi aksi={arsipkanRuang} data={{ ruang_id: a.ruang.id, arsip: a.ruang.arsip ? '0' : '1' }} teks={a.ruang.arsip ? 'Buka arsip' : 'Arsipkan ruang'} cls="kecil abu" konfirmasi={a.ruang.arsip ? undefined : 'Arsipkan ruang? Pesan tetap bisa dibaca tetapi tidak bisa dikirim.'} />
          <TombolAksi aksi={hapusRuang} data={{ ruang_id: a.ruang.id }} ikon="trash" teks="Hapus ruang" cls="kecil bahaya" konfirmasi="Hapus ruang beserta seluruh pesannya? Tidak bisa dibatalkan." />
        </div>
      </div></details>}
  </Shell>)
}
