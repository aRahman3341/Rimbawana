'use client'
import { useEffect, useRef, useState } from 'react'
import { kirimPesan, kirimMeet, hapusPesan } from '@/app/chat/actions'

const fmt = (iso, panjang) => new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', ...(panjang ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' }), hour: '2-digit', minute: '2-digit' })

export default function ChatRoom({ ruangId, sayaId, awal, bisaKirim, admin }) {
  const [pesan, setPesan] = useState(awal)
  const [err, setErr] = useState('')
  const [meet, setMeet] = useState(false)
  const [kirim, setKirim] = useState(false)
  const akhir = useRef(awal.length ? awal[awal.length - 1].id : 0)
  const bawah = useRef(null), kotak = useRef(null)

  async function ambil() {
    try {
      const r = await fetch(`/api/chat/${ruangId}?after=${akhir.current}`, { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      if (j.pesan?.length) {
        const el = kotak.current, dekat = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 140
        akhir.current = j.pesan[j.pesan.length - 1].id
        setPesan(p => [...p, ...j.pesan])
        if (dekat) setTimeout(() => bawah.current?.scrollIntoView({ behavior: 'smooth' }), 60)
      }
    } catch {}
  }
  useEffect(() => {
    bawah.current?.scrollIntoView()
    const t = setInterval(() => { if (!document.hidden) ambil() }, 4000)
    return () => clearInterval(t)
  }, [])

  async function kirimForm(e, aksi, tutupMeet) {
    e.preventDefault(); const f = e.currentTarget; setErr(''); setKirim(true)
    const fd = new FormData(f); fd.set('ruang_id', ruangId)
    const r = await aksi(null, fd)
    setKirim(false)
    if (r?.error) return setErr(r.error)
    f.reset(); if (tutupMeet) setMeet(false)
    await ambil(); setTimeout(() => bawah.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }
  async function hapus(id) {
    if (!confirm('Hapus pesan ini?')) return
    const fd = new FormData(); fd.set('id', id); await hapusPesan(fd)
    setPesan(p => p.map(x => x.id === id ? { ...x, dihapus: true, isi: null, meet_url: null } : x))
  }
  const Jam = ({ p, saya }) => (<span className="jam">{fmt(p.created_at)}{(saya || admin) && !p.dihapus && <button type="button" onClick={() => hapus(p.id)} title="Hapus"><i className="bi bi-trash" /></button>}</span>)

  return (<div className="chat">
    <div className="isi" ref={kotak}>
      {pesan.length === 0 && <p className="sistem">Belum ada pesan. Mulai percakapan.</p>}
      {pesan.map(p => {
        const saya = p.pengirim_id === sayaId
        if (p.dihapus) return <div key={p.id} className={`gel hapus ${saya ? 'saya' : ''}`}><i className="bi bi-slash-circle" /> Pesan dihapus</div>
        if (p.jenis === 'meet') {
          const mulai = p.meet_waktu ? new Date(p.meet_waktu) : null, selesai = mulai && Date.now() > mulai.getTime() + 3 * 3600 * 1000
          return (<div key={p.id} className={`meet ${saya ? 'saya' : ''}`}>
            <div className="kepala"><i className="bi bi-camera-video-fill" /> {p.meet_judul || 'Rapat online'}</div>
            <div className="badan">
              <small>Dibagikan oleh {saya ? 'kamu' : p.pengirim?.nama_adat || '-'}</small>
              {mulai && <span><i className="bi bi-clock" /> {fmt(p.meet_waktu, true)} WIB {selesai && <em>(sudah lewat)</em>}</span>}
              {p.isi && <span className="teks">{p.isi}</span>}
              <a className="btn kecil" href={p.meet_url} target="_blank" rel="noreferrer"><i className="bi bi-box-arrow-up-right" /> Gabung Google Meet</a>
              <Jam p={p} saya={saya} />
            </div></div>)
        }
        return (<div key={p.id} className={`gel ${saya ? 'saya' : ''}`}>
          {!saya && <span className="nama">{p.pengirim?.nama_adat || '-'}</span>}<span className="teks">{p.isi}</span><Jam p={p} saya={saya} /></div>)
      })}
      <div ref={bawah} />
    </div>
    {err && <p className="err" style={{ margin: 0, padding: '6px 12px' }}>{err}</p>}
    {bisaKirim ? (<>
      {meet && <form className="meetform" onSubmit={e => kirimForm(e, kirimMeet, true)}>
        <div className="grid">
          <div><label>Judul rapat</label><input name="judul" placeholder="Rapat evaluasi Mabim" maxLength={120} /></div>
          <div><label>Waktu (WIB)</label><input name="waktu" type="datetime-local" /></div>
        </div>
        <label>Link Google Meet</label><input name="url" type="url" required placeholder="https://meet.google.com/abc-defg-hij" />
        <small>Belum punya link? <a href="https://meet.new" target="_blank" rel="noreferrer">Buat rapat Meet baru</a>, salin linknya, lalu tempel di sini.</small>
        <label>Catatan (opsional)</label><input name="catatan" maxLength={300} />
        <p style={{ margin: '10px 0 0' }}><button disabled={kirim}>Bagikan ke ruang</button> <button type="button" className="abu" onClick={() => setMeet(false)}>Batal</button></p>
      </form>}
      <form className="kirim" onSubmit={e => kirimForm(e, kirimPesan)}>
        <button type="button" className="abu" title="Bagikan link Google Meet" onClick={() => setMeet(!meet)}><i className="bi bi-camera-video" /></button>
        <textarea name="isi" rows={1} placeholder="Tulis pesan..." maxLength={2000} required
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit() } }} />
        <button disabled={kirim}><i className="bi bi-send" /></button>
      </form></>) : <p className="redup" style={{ margin: 0, padding: 12, textAlign: 'center' }}>Ruang ini hanya bisa dibaca.</p>}
  </div>)
}
