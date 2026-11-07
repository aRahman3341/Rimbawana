import Link from 'next/link'
import { admin, ambil } from '@/lib/db'
import { urlFoto } from '@/lib/berkas'
import { DIVISI } from '@/lib/format'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Katalog Alat' }

export default async function Katalog({ searchParams }) {
  const div = DIVISI[searchParams.divisi] ? searchParams.divisi : ''
  const cari = String(searchParams.q || '').replace(/[%_\\]/g, '').slice(0, 60)
  let q = admin().from('v_stok_jenis').select('*').gt('bebas', 0).eq('sembunyikan', false).order('divisi').order('urut')
  if (div) q = q.eq('divisi', div)
  if (cari) q = q.ilike('nama', `%${cari}%`)
  const daftar = ambil(await q)
  return (<section className="seksi">
    <h2 className="jdl">Katalog Alat</h2>
    <p className="lead">Alat milik Rimbawana yang bisa dipinjam. Alat yang sedang dipinjam atau sudah dipesan otomatis hilang dari daftar ini.</p>
    <div className="tabs">
      <Link className={`tab ${!div ? 'aktif' : ''}`} href="/katalog">Semua</Link>
      {Object.entries(DIVISI).map(([k, t]) => <Link key={k} className={`tab ${div === k ? 'aktif' : ''}`} href={`/katalog?divisi=${k}`}>{t}</Link>)}
    </div>
    <form className="cari" style={{ marginBottom: 18 }}>
      {div && <input type="hidden" name="divisi" value={div} />}
      <input name="q" placeholder="Cari alat, mis. carabiner" defaultValue={cari} /><button>Cari</button>
    </form>
    {daftar.length === 0 ? <p className="kosong">Tidak ada alat yang tersedia saat ini.</p> : (
      <div className="katalog">
        {daftar.map(j => (
          <article className="barang" key={j.id}>
            <div className="foto">{j.foto_path ? <img src={urlFoto(j.foto_path)} alt={j.nama} loading="lazy" /> : <i className="bi bi-box-seam" />}</div>
            <div className="isi">
              <span className="lencana coklat" style={{ justifySelf: 'start' }}>{DIVISI[j.divisi]}</span>
              <h3>{j.nama}</h3>
              {j.keterangan && <div className="ket">{j.keterangan}</div>}
              <div><span className="lencana hijau">Tersedia {j.bebas}</span> <small>{j.satuan}</small></div>
              <Link className="btn kecil" style={{ justifySelf: 'start' }} href={`/pinjam?jenis=${j.id}`}>Pinjam</Link>
            </div>
          </article>))}
      </div>)}
  </section>)
}
