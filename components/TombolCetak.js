'use client'
export default function TombolCetak({ teks = 'Cetak' }) {
  return <button type="button" className="tanpa-cetak" onClick={() => window.print()}><i className="bi bi-printer" /> {teks}</button>
}
