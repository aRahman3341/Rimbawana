import Link from 'next/link'
import { admin, ambil } from '@/lib/db'
import { mini } from '@/lib/berkas'
import { tgl } from '@/lib/format'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Galeri' }

const JENIS = { foto: 'Foto', video: 'Video', album: 'Album' }
const IKON = { foto: 'image', video: 'play-circle', album: 'collection', dokumen: 'file-earmark-text' }
export default async function Galeri({ searchParams }) {
  const j = JENIS[searchParams.jenis] ? searchParams.jenis : ''
  let q = admin().from('media_rimbawana').select('*').eq('tampil', true).order('tanggal', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(120)
  if (j) q = q.eq('jenis', j)
  const daftar = ambil(await q)
  return (<section className="seksi">
    <h2 className="jdl">Galeri</h2>
    <p className="lead">Dokumentasi kegiatan Rimbawana. Video dan album dibuka di Google Drive.</p>
    <div className="tabs"><Link className={`tab ${!j ? 'aktif' : ''}`} href="/galeri">Semua</Link>
      {Object.entries(JENIS).map(([k, t]) => <Link key={k} className={`tab ${j === k ? 'aktif' : ''}`} href={`/galeri?jenis=${k}`}>{t}</Link>)}</div>
    {daftar.length === 0 ? <p className="kosong">Belum ada media.</p> : (
      <div className="katalog">
        {daftar.map(m => { const href = m.drive_url || (m.foto_path ? mini(m) : null)
          return (<a key={m.id} href={href} target="_blank" rel="noreferrer" className="barang" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="foto" style={{ position: 'relative' }}>
              {mini(m) ? <img src={mini(m)} alt={m.judul} loading="lazy" /> : <i className={`bi bi-${IKON[m.jenis]}`} />}
              {m.jenis === 'video' && <i className="bi bi-play-circle-fill" style={{ position: 'absolute', color: '#fff', fontSize: '3rem', textShadow: '0 2px 12px #0009' }} />}
            </div>
            <div className="isi"><h3>{m.judul}</h3>{m.deskripsi && <div className="ket">{m.deskripsi}</div>}<div className="ket">{tgl(m.tanggal)}</div></div>
          </a>) })}
      </div>)}
  </section>)
}
