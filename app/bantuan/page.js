import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import { redirect } from 'next/navigation'
import { getSaya, DAFTAR_IZIN, judulIzin } from '@/lib/auth'
import { admin } from '@/lib/db'
import { tgl } from '@/lib/format'
import { ajukanAkses } from './actions'
export const dynamic = 'force-dynamic'

const ST = { baru: ['kuning', 'Menunggu'], disetujui: ['hijau', 'Disetujui'], ditolak: ['merah', 'Ditolak'] }
export default async function Bantuan({ searchParams }) {
  const saya = await getSaya()
  if (!saya) redirect('/login')
  if (saya.peran === 'founder') redirect('/akses')
  const minta = DAFTAR_IZIN.find(i => i.kunci === searchParams.izin && !saya.izin.includes(i.kunci))
  const saku = await admin().from('akses_permintaan').select('*').eq('anggota_id', saya.id).order('created_at', { ascending: false }).limit(20).then(r => r.error ? [] : r.data)
  const belum = DAFTAR_IZIN.filter(i => !saya.izin.includes(i.kunci))
  return (<Shell aktif="bantuan" judul="CS Founder">
    {minta && <div className="form" style={{ borderColor: 'var(--api)', marginBottom: 14 }}>
      <b><i className="bi bi-lock" /> Kamu belum punya akses ke &ldquo;{minta.judul}&rdquo;.</b>
      <p style={{ margin: '4px 0 0' }}>{minta.ket} Ajukan permintaan di bawah, CS Founder akan menjawabnya.</p></div>}
    <div className="dua">
      <FormAksi aksi={ajukanAkses} className="form" tombol="Kirim ke CS Founder">
        <h2>Minta akses atau bantuan</h2>
        <p className="redup" style={{ margin: '0 0 6px' }}>Butuh membuka fitur yang belum bisa kamu akses? Atau ada kendala di sistem? Tulis di sini.</p>
        <label>Yang kamu butuhkan</label>
        <select name="izin" defaultValue={minta?.kunci || ''}>
          <option value="">Bantuan lain (bukan akses)</option>
          {belum.map(i => <option key={i.kunci} value={i.kunci}>Akses: {i.judul}</option>)}
        </select>
        <label>Alasan / keperluan</label><textarea name="pesan" required minLength={5} maxLength={500} placeholder="mis. Saya panitia Mabim dan perlu mengarsipkan surat undangan." />
      </FormAksi>
      <div>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Permintaan saya</h2>
        {saku.length === 0 && <p className="kosong">Belum ada permintaan.</p>}
        {saku.map(p => { const [w, lb] = ST[p.status]
          return (<div className="form" key={p.id} style={{ marginBottom: 10 }}>
            <div className="baris" style={{ marginBottom: 4 }}><span className={`lencana ${w}`}>{lb}</span><b>{p.izin ? judulIzin(p.izin) : 'Bantuan lain'}</b><small className="ms-auto">{tgl(p.created_at)}</small></div>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{p.pesan}</p>
            {p.balasan && <p style={{ margin: '8px 0 0', padding: '8px 12px', background: 'var(--embun)', borderRadius: 10 }}><b>CS Founder:</b> {p.balasan}</p>}
            {p.status === 'disetujui' && p.izin && <p className="ok" style={{ margin: '6px 0 0' }}>Akses sudah aktif untukmu.</p>}
          </div>) })}
      </div>
    </div>
  </Shell>)
}
