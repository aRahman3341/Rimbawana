'use client'
// Menampilkan pesan error di layar (bukan halaman kosong)
export default function Error({ error, reset }) {
  return (<main><div className="kartu" style={{ maxWidth: 560 }}>
    <h2>Terjadi kesalahan</h2>
    <p className="err" style={{ whiteSpace: 'pre-wrap' }}>{error?.message || 'Kesalahan tidak diketahui'}</p>
    {error?.digest && <p>Kode: {error.digest}</p>}
    <button onClick={() => reset()}>Coba lagi</button> <a className="btn kuning" href="/dashboard">Ke Dashboard</a>
  </div></main>)
}
