import Link from 'next/link'
import { getProfil, getAngkatanPublik } from '@/lib/profil'
import { labelAngkatan } from '@/lib/angkatan'
export const metadata = { title: 'Tentang Rimbawana' }

const tahunDari = (t) => { const m = /\d{4}/.exec(t || ''); return m ? Number(m[0]) : null }

export default async function Tentang() {
  const [{ identitas: IDENTITAS, sejarah, divisi: DIVISI_PUBLIK, kaderisasi: KADERISASI }, angkatan] = await Promise.all([getProfil(), getAngkatanPublik()])
  // Susun sejarah per tahun: cerita dan nama angkatan digabung berdasarkan tahunnya.
  const peta = new Map(), tanpaTahun = []
  const ambil = (t) => { if (!peta.has(t)) peta.set(t, { cerita: [], angkatan: [] }); return peta.get(t) }
  sejarah.forEach(s => { const t = tahunDari(s.tahun); t ? ambil(t).cerita.push(s) : tanpaTahun.push(s) })
  angkatan.forEach(a => ambil(a.tahun).angkatan.push(a))
  const tahun = [...peta.keys()].sort((a, b) => a - b)
  const sekarang = new Date().getFullYear()
  const kosong = tahun.length === 0 && tanpaTahun.length === 0

  return (<>
    <section className="seksi">
      <h2 className="jdl">Sejarah Rimbawana</h2>
      <p className="lead">Perjalanan {IDENTITAS.lengkap} sejak {IDENTITAS.tahun_berdiri} hingga {sekarang}, beserta angkatan di tiap tahunnya.</p>
      {kosong ? <div className="kotak"><p>Sejarah terbentuknya Rimbawana akan segera dilengkapi di halaman ini.</p></div> : (<>
        {tahun.length > 1 && <nav className="lompat" aria-label="Lompat ke tahun">{tahun.map(t => <a key={t} href={`#t${t}`}>{t}</a>)}</nav>}
        <div className="riwayat">
          {tanpaTahun.map((s, i) => (
            <div className="thn" key={`x${i}`}><div className="th">&bull;</div><div className="isi">{s.judul && <h3>{s.judul}</h3>}<p>{s.isi}</p></div></div>))}
          {tahun.map(t => { const d = peta.get(t)
            return (<div className="thn" id={`t${t}`} key={t}>
              <div className="th">{t}</div>
              <div className="isi">
                {d.cerita.map(s => <div key={s.id || s.judul} className="cerita">{s.judul && <h3>{s.judul}</h3>}<p>{s.isi}</p></div>)}
                {d.angkatan.length > 0 && <div className="angk"><small>Angkatan {t}</small>
                  <div>{d.angkatan.map(a => <span key={a.id} className="chip" title={a.keterangan || undefined}>{labelAngkatan(a)}</span>)}</div></div>}
              </div></div>) })}
        </div></>)}
    </section>

    <section className="seksi">
      <h2 className="jdl">Siapa Kami</h2>
      <p className="lead">{IDENTITAS.lengkap} adalah organisasi mahasiswa di {IDENTITAS.kampus} yang berorientasi pada pendidikan dan lingkungan. Pengkaderan dijalankan berjenjang agar regenerasi tetap berkualitas di bidangnya.</p>
      <div className="kisi">
        {DIVISI_PUBLIK.map(d => (
          <article className="kotak" key={d.id || d.kode}>
            <div className="ik"><i className={`bi bi-${d.ikon}`} /></div>
            <h3>{d.nama}</h3><p>{d.isi}</p>
          </article>))}
      </div>
    </section>

    <section className="seksi">
      <h2 className="jdl">Alur Kaderisasi</h2>
      <div className="jalur" style={{ marginTop: 24 }}>
        {KADERISASI.map(k => (
          <div className="pos" key={k.tahap}>
            <h3>{k.tahap}</h3><p>{k.isi}</p>
            {k.sub?.length > 0 && <ul>{k.sub.map(s => <li key={s}>{s}</li>)}</ul>}
          </div>))}
      </div>
    </section>

    <section className="seksi">
      <h2 className="jdl">Hubungi Kami</h2>
      <div className="kotak">
        <p><i className="bi bi-geo-alt" /> {IDENTITAS.alamat}</p>
        <p style={{ marginTop: 8 }}><i className="bi bi-envelope" /> <a href={`mailto:${IDENTITAS.email}`}>{IDENTITAS.email}</a></p>
        <p style={{ marginTop: 14 }}><Link className="btn" href="/pinjam">Ajukan Peminjaman Alat</Link></p>
      </div>
    </section>
  </>)
}
