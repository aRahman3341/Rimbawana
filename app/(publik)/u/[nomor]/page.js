import Link from 'next/link'
import { notFound } from 'next/navigation'
import { admin, ambil } from '@/lib/db'
import { urlFoto } from '@/lib/berkas'
import { DIVISI, tgl } from '@/lib/format'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Info Barang' }

// Halaman tujuan QR code pada label barang.
export default async function InfoUnit({ params }) {
  const nomor = decodeURIComponent(params.nomor).slice(0, 60)
  const u = ambil(await admin().from('barang_unit')
    .select('nomor,kondisi,status,keterangan,batas_kembali,pemilik:mapala_mitra(nama),jenis:barang_jenis(nama,divisi,satuan,foto_path)')
    .eq('nomor', nomor).maybeSingle())
  if (!u) notFound()
  const bisa = u.status === 'tersedia' && u.kondisi === 'layak'
  return (<section className="seksi" style={{ maxWidth: 560 }}>
    <div className="kotak">
      {u.jenis.foto_path && <img src={urlFoto(u.jenis.foto_path)} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />}
      <span className="lencana coklat">{DIVISI[u.jenis.divisi]}</span>
      <h2 style={{ margin: '8px 0 2px' }}>{u.jenis.nama}</h2>
      <p className="redup" style={{ marginBottom: 12 }}>Nomor barang: <b>{u.nomor}</b></p>
      <p><span className={`lencana ${u.kondisi === 'layak' ? 'hijau' : 'merah'}`}>{u.kondisi === 'layak' ? 'Layak pakai' : 'Tidak layak pakai'}</span>{' '}
        <span className={`lencana ${u.status === 'tersedia' ? 'hijau' : 'kuning'}`}>{u.status === 'tersedia' ? 'Tersedia' : u.status === 'dipinjam' ? 'Sedang dipinjam' : 'Nonaktif'}</span></p>
      {u.pemilik && <p style={{ marginTop: 10 }}>Pinjaman dari <b>{u.pemilik.nama}</b>{u.batas_kembali ? `, dikembalikan sebelum ${tgl(u.batas_kembali)}` : ''}.</p>}
      {u.keterangan && <p style={{ marginTop: 10 }}>{u.keterangan}</p>}
      {bisa && <p style={{ marginTop: 16 }}><Link className="btn" href="/pinjam">Pinjam alat</Link></p>}
    </div>
  </section>)
}
