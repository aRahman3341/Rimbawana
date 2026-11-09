'use client'
import { useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { ajukanPinjam } from './actions'

const DIV = { RC: 'Panjat Tebing', HG: 'Hutan Gunung', PLH: 'Lingkungan Hidup', UMUM: 'Umum' }
function Kirim({ total }) {
  const { pending } = useFormStatus()
  return <button className="btn kuning" style={{ width: '100%', padding: 14, fontSize: '1rem' }} disabled={pending}>{pending ? 'Mengirim...' : total ? `Kirim Permintaan (${total} alat)` : 'Kirim Permintaan'}</button>
}

export default function PinjamSederhana({ jenis, awal, hariIni, besok }) {
  const [jumlah, setJumlah] = useState(awal ? { [awal]: 1 } : {})
  const [cari, setCari] = useState('')
  const [s, aksi] = useFormState(ajukanPinjam, null)
  const ubah = (j, d) => setJumlah(p => { const n = Math.max(0, Math.min(j.bebas, (p[j.id] || 0) + d)); const x = { ...p }; n ? x[j.id] = n : delete x[j.id]; return x })
  const total = Object.values(jumlah).reduce((a, b) => a + b, 0)
  const items = Object.entries(jumlah).map(([jenis_id, n]) => ({ jenis_id, jumlah: n }))
  const grup = useMemo(() => {
    const q = cari.trim().toLowerCase(), g = {}
    jenis.filter(j => !q || j.nama.toLowerCase().includes(q)).forEach(j => { (g[j.divisi] ||= []).push(j) })
    return g
  }, [jenis, cari])

  if (s?.ok) return (
    <div className="kotak" style={{ textAlign: 'center' }}>
      <div className="ik" style={{ margin: '0 auto 12px', background: 'var(--lumut)', color: '#fff' }}><i className="bi bi-check2" /></div>
      <h3>Permintaan terkirim</h3><p>{s.ok}</p>
      <p style={{ marginTop: 14 }}><a className="btn" href="/pinjam">Pinjam lagi</a></p>
    </div>)

  return (<form action={aksi}>
    <input className="cari-alat" value={cari} onChange={e => setCari(e.target.value)} placeholder="Cari alat..." aria-label="Cari alat" />
    {jenis.length === 0 && <p className="kosong">Tidak ada alat yang tersedia saat ini.</p>}
    <div className="alat-daftar">
      {Object.entries(grup).map(([d, list]) => (<div key={d}>
        <div className="alat-grup">{DIV[d] || d}</div>
        {list.map(j => { const n = jumlah[j.id] || 0
          return (<div className={`alat-baris ${n ? 'dipilih' : ''}`} key={j.id}>
            <div className="alat-nama"><b>{j.nama}</b><small>{j.keterangan ? `${j.keterangan} - ` : ''}tersedia {j.bebas}</small></div>
            <div className="stepper">
              <button type="button" onClick={() => ubah(j, -1)} disabled={!n} aria-label={`Kurangi ${j.nama}`}>&minus;</button>
              <span>{n}</span>
              <button type="button" onClick={() => ubah(j, 1)} disabled={n >= j.bebas} aria-label={`Tambah ${j.nama}`}>+</button>
            </div></div>) })}
      </div>))}
      {jenis.length > 0 && Object.keys(grup).length === 0 && <p className="kosong">Alat tidak ditemukan.</p>}
    </div>

    <div className="form" style={{ marginTop: 16 }}>
      <div className="grid">
        <div><label>Nama</label><input name="nama" required maxLength={80} autoComplete="name" /></div>
        <div><label>No WhatsApp</label><input name="hp" inputMode="tel" required maxLength={20} placeholder="08xxxxxxxxxx" autoComplete="tel" /></div>
        <div><label>Mulai pinjam</label><input name="tgl_pinjam" type="date" min={hariIni} defaultValue={hariIni} required /></div>
        <div><label>Kembali</label><input name="tgl_kembali" type="date" min={hariIni} defaultValue={besok} required /></div>
      </div>
      <label>Untuk keperluan</label><input name="keperluan" required maxLength={300} placeholder="mis. latihan panjat tebing" />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      {s?.error && <p className="err">{s.error}</p>}
      <div style={{ marginTop: 12 }}><Kirim total={total} /></div>
      <small className="redup" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>Pengurus perlengkapan akan menghubungi WhatsApp kamu.</small>
    </div>
  </form>)
}
