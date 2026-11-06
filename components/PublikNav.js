import Link from 'next/link'
import { IDENTITAS } from '@/lib/konten'
export default function PublikNav() {
  return (
    <header className="nav">
      <input id="nav-t" className="nav-toggle" type="checkbox" hidden />
      <div className="dalam">
        <Link className="logo" href="/"><img src="/logo.png" alt="" /><b>{IDENTITAS.nama}</b></Link>
        <label htmlFor="nav-t" className="hb"><i className="bi bi-list" /></label>
        <nav className="menu">
          <Link href="/">Beranda</Link><Link href="/tentang">Tentang</Link>
          <Link href="/katalog">Katalog Alat</Link><Link href="/pinjam">Pinjam Alat</Link>
          <Link className="cta" href="/login">Masuk Anggota</Link>
        </nav>
      </div>
    </header>)
}
