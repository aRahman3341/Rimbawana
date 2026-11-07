import Link from 'next/link'
import Punggung from '@/components/Punggung'
import { getProfil } from '@/lib/profil'
export const revalidate = 60

export default async function Beranda() {
  const { identitas: IDENTITAS, divisi: DIVISI_PUBLIK, kaderisasi: KADERISASI } = await getProfil()
  return (<>
    <section className="hero">
      <img className="lambang" src="/logo.png" alt="Lambang Rimbawana" />
      <h1>{IDENTITAS.nama}</h1>
      <p className="sub">{IDENTITAS.lengkap}<br />{IDENTITAS.kampus}</p>
      <span className="tag"><i className="bi bi-compass" /> {IDENTITAS.tagline}</span>
      <div className="aksi">
        <Link className="btn kuning" href="/pinjam"><i className="bi bi-backpack" /> Pinjam Alat</Link>
        <Link className="btn garis" href="/tentang">Kenali Rimbawana</Link>
        <Link className="btn garis" href="/login">Masuk Anggota</Link>
      </div>
      <Punggung />
    </section>

    <section className="seksi">
      <h2 className="jdl">Tiga Divisi</h2>
      <p className="lead">Tempat belajar dan berkegiatan di alam, dengan pendidikan dan kelestarian lingkungan sebagai arah.</p>
      <div className="kisi">
        {DIVISI_PUBLIK.map(d => (
          <article className="kotak" key={d.id || d.kode}>
            <div className="ik"><i className={`bi bi-${d.ikon}`} /></div>
            <h3>{d.nama}</h3><p>{d.isi}</p>
          </article>))}
      </div>
    </section>

    <section className="seksi">
      <h2 className="jdl">Jalur Pengkaderan</h2>
      <p className="lead">Setiap calon anggota melewati tahapan pendidikan yang berjenjang.</p>
      <div className="jalur">
        {KADERISASI.map(k => (
          <div className="pos" key={k.tahap}>
            <h3>{k.tahap}</h3><p>{k.isi}</p>
            {k.sub?.length > 0 && <ul>{k.sub.map(s => <li key={s}>{s}</li>)}</ul>}
          </div>))}
      </div>
    </section>

    <section className="seksi">
      <div className="pita">
        <div><h3>Butuh peralatan untuk berkegiatan?</h3>
          <p>Lihat alat yang tersedia dan ajukan peminjaman tanpa perlu login. Pengurus perlengkapan akan memverifikasi permintaanmu.</p></div>
        <Link className="btn kuning" href="/katalog">Lihat Katalog Alat</Link>
      </div>
    </section>
  </>)
}
