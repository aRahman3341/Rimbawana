import Link from 'next/link'
import { judulIzin } from '@/lib/auth'
// Muncul di halaman yang hanya bisa dilihat: jalan pintas untuk meminta izin kelola ke CS Founder.
export default function MintaAkses({ izin }) {
  return (
    <p className="redup" style={{ margin: '0 0 14px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <i className="bi bi-eye" /> Kamu hanya bisa melihat halaman ini.
      <Link className="btn kecil abu" href={`/bantuan?izin=${izin}`}>Minta akses &ldquo;{judulIzin(izin)}&rdquo;</Link>
    </p>)
}
