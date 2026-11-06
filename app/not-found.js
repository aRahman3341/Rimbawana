import Link from 'next/link'
export default function NotFound() {
  return (<main><div className="kartu"><h2>Halaman tidak ditemukan</h2>
    <p>Data yang dicari tidak ada, atau kamu tidak punya akses ke sana.</p>
    <Link className="btn" href="/dashboard">Ke Dashboard</Link></div></main>)
}
