import Link from 'next/link'
import { keluar } from '@/app/login/actions'
import { PERAN } from '@/lib/akun'
import { getSaya, boleh } from '@/lib/auth'

// izin = nama kelompok di lib/auth.js. Tanpa izin = semua anggota yang login.
const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: 'compass', href: '/dashboard' },
  { label: 'Inventaris', icon: 'backpack', items: [
    { id: 'barang', label: 'Data Barang', href: '/barang' },
    { id: 'peminjaman', label: 'Peminjaman', href: '/peminjaman', izin: 'inventaris' } ] },
  { label: 'Persuratan', icon: 'envelope-paper', izin: 'pengurus', items: [
    { id: 'surat', label: 'Arsip Surat', href: '/surat' } ] },
  { label: 'Keuangan', icon: 'wallet2', items: [
    { id: 'kas', label: 'Kas Anggota', href: '/kas' },
    { id: 'keuangan', label: 'Buku Kas', href: '/keuangan', izin: 'pengurus' },
    { id: 'kegiatan', label: 'RAB Kegiatan', href: '/kegiatan', izin: 'pengurus' } ] },
  { label: 'Master', icon: 'database', items: [
    { id: 'anggota', label: 'Anggota', href: '/anggota' },
    { id: 'lokasi', label: 'Lokasi Simpan', href: '/lokasi', izin: 'inventaris' },
    { id: 'mapala', label: 'Mapala Mitra', href: '/mapala', izin: 'inventaris' } ] },
]
const Tautan = ({ m, aktif }) => (
  <Link href={m.href} className={aktif === m.id ? 'aktif' : ''}><i className={`bi bi-${m.icon || 'dot'}`} />{m.label}</Link>)

export default async function Shell({ aktif, judul, children }) {
  const saya = await getSaya()
  const peran = saya && PERAN[saya.peran] !== '-' ? PERAN[saya.peran] : 'Anggota'
  const menu = MENU.map(g => g.items
    ? { ...g, items: g.items.filter(i => boleh(saya, i.izin)) }
    : g).filter(g => (!g.izin || boleh(saya, g.izin)) && (!g.items || g.items.length))
  return (<>
    <input id="menu" type="checkbox" hidden />
    <div className="app">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard"><img src="/logo.png" alt="" /><span>Rimbawana<small>UPI Kampus Cibiru</small></span></Link>
        {menu.map(g => g.items ? (
          <details key={g.label} open={g.items.some(i => i.id === aktif)}>
            <summary><i className={`bi bi-${g.icon}`} />{g.label}<i className="bi bi-chevron-down ms-auto" /></summary>
            <div>{g.items.map(i => <Tautan key={i.id} m={i} aktif={aktif} />)}</div>
          </details>) : <Tautan key={g.id} m={g} aktif={aktif} />)}
        <div className="pemisah" />
        <Link href="/"><i className="bi bi-house-door" />Lihat Situs Publik</Link>
      </aside>
      <div className="konten">
        <header className="topbar">
          <label htmlFor="menu" className="burger"><i className="bi bi-list" /></label>
          <h1>{judul}</h1>
          <div className="user"><span><b>{saya?.nama_adat}</b><small>{peran}</small></span>
            <form action={keluar}><button className="kecil" title="Keluar"><i className="bi bi-box-arrow-right" /></button></form></div>
        </header>
        <main>{children}</main>
      </div>
    </div></>)
}
