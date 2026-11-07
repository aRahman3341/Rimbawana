import Link from 'next/link'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { daftarRuang, kandidatRuang } from '@/lib/chat'
import { PERAN } from '@/lib/akun'
import { buatRuang } from './actions'
export const dynamic = 'force-dynamic'

export default async function Chat() {
  const saya = await wajibMasuk('lihat')
  const adm = admin()
  const ruang = await daftarRuang(adm, saya)
  const info = await Promise.all(ruang.map(async r => {
    const [{ data: baca }, { data: akhir }] = await Promise.all([
      adm.from('chat_baca').select('terakhir_id').eq('ruang_id', r.id).eq('anggota_id', saya.id).maybeSingle(),
      adm.from('chat_pesan').select('id,isi,jenis,meet_judul,dihapus,pengirim:anggota!pengirim_id(nama_adat)').eq('ruang_id', r.id).order('id', { ascending: false }).limit(1)])
    const { count } = saya.peran === 'founder' ? { count: 0 } : await adm.from('chat_pesan').select('id', { count: 'exact', head: true }).eq('ruang_id', r.id).gt('id', baca?.terakhir_id || 0).neq('pengirim_id', saya.id)
    return { ...r, belum: count || 0, akhir: akhir?.[0] }
  }))
  const kelola = boleh(saya, 'chatAdmin')
  const kandidat = kelola ? ambil(await kandidatRuang(adm)).filter(k => k.id !== saya.id) : []
  return (<Shell aktif="chat" judul="Chat Pengurus">
    <p className="redup" style={{ marginTop: 0 }}>Ruang percakapan untuk pengurus dan BPR. Pesan baru muncul otomatis. Rapat online dibagikan sebagai kartu Google Meet.</p>
    {kelola && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Buat Ruang</summary>
      <FormAksi aksi={buatRuang} className="form" tombol="Buat Ruang" reset={false}>
        <div className="grid"><div><label>Nama ruang</label><input name="nama" required maxLength={80} placeholder="Panitia Mabim" /></div>
          <div><label>Jenis</label><select name="tipe"><option value="khusus">Khusus (anggota dipilih)</option><option value="umum">Umum (semua pengurus dan BPR)</option></select></div></div>
        <label>Deskripsi</label><input name="deskripsi" maxLength={200} />
        <label>Anggota ruang khusus</label>
        <div className="grid">{kandidat.map(k => <label key={k.id} style={{ fontWeight: 400, margin: '2px 0' }}><input type="checkbox" name="anggota" value={k.id} style={{ marginRight: 8 }} />{k.nama_adat} <small>({PERAN[k.peran]})</small></label>)}</div>
      </FormAksi></details>}
    <div className="daftar-ruang">
      {info.length === 0 && <p className="kosong">Belum ada ruang chat untukmu.</p>}
      {info.map(r => (<Link key={r.id} href={`/chat/${r.id}`} className="ruang">
        <div className="ik"><i className={`bi bi-${r.tipe === 'umum' ? 'people-fill' : 'chat-dots-fill'}`} /></div>
        <div className="tx"><b>{r.nama}{r.arsip && <span className="lencana abu" style={{ marginLeft: 6 }}>arsip</span>}</b>
          <small className="redup">{r.akhir ? (r.akhir.dihapus ? 'Pesan dihapus' : `${r.akhir.pengirim?.nama_adat || '-'}: ${r.akhir.jenis === 'meet' ? `Meet - ${r.akhir.meet_judul || 'rapat online'}` : r.akhir.isi}`) : (r.deskripsi || 'Belum ada pesan')}</small></div>
        {r.belum > 0 && <span className="titik">{r.belum > 99 ? '99+' : r.belum}</span>}
      </Link>))}
    </div>
  </Shell>)
}
