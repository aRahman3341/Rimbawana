import Link from 'next/link'
import { IDENTITAS, SEJARAH, DIVISI_PUBLIK, KADERISASI } from '@/lib/konten'
export const metadata = { title: 'Tentang Rimbawana' }

export default function Tentang() {
  return (<>
    <section className="seksi">
      <h2 className="jdl">Sejarah Rimbawana</h2>
      <p className="lead">Perjalanan terbentuknya {IDENTITAS.lengkap}.</p>
      {SEJARAH.length ? (
        <div className="sejarah">
          {SEJARAH.map((s, i) => (
            <div className="itm" key={i}>
              {s.tahun && <div className="th">{s.tahun}</div>}
              {s.judul && <h3>{s.judul}</h3>}
              <p>{s.isi}</p>
            </div>))}
        </div>
      ) : (
        <div className="kotak"><p>Sejarah terbentuknya Rimbawana akan segera dilengkapi di halaman ini.</p></div>
      )}
    </section>

    <section className="seksi">
      <h2 className="jdl">Siapa Kami</h2>
      <p className="lead">{IDENTITAS.lengkap} adalah organisasi mahasiswa di {IDENTITAS.kampus} yang berorientasi pada pendidikan dan lingkungan. Pengkaderan dijalankan berjenjang agar regenerasi tetap berkualitas di bidangnya.</p>
      <div className="kisi">
        {DIVISI_PUBLIK.map(d => (
          <article className="kotak" key={d.kode}>
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
            {k.sub && <ul>{k.sub.map(s => <li key={s}>{s}</li>)}</ul>}
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
