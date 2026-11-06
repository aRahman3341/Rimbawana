'use client'
import { useState } from 'react'
// Pilih beberapa barang + jumlah. Hasil dikirim sebagai JSON di <input name={name}>.
export default function BarisBarang({ name = 'items', jenis, awal = [], tampilStok = true }) {
  const [rows, setRows] = useState(awal.length ? awal : [{ jenis_id: '', jumlah: 1 }])
  const ubah = (i, p) => setRows(rows.map((r, j) => j === i ? { ...r, ...p } : r))
  return (<div>
    {rows.map((r, i) => (
      <div className="pilih-baris" key={i}>
        <select value={r.jenis_id} onChange={e => ubah(i, { jenis_id: e.target.value })} required>
          <option value="">- pilih barang -</option>
          {jenis.map(j => <option key={j.id} value={j.id}>{j.nama} ({j.divisi}){tampilStok ? ` - tersedia ${j.tersedia}` : ''}</option>)}
        </select>
        <input type="number" min="1" value={r.jumlah} onChange={e => ubah(i, { jumlah: Number(e.target.value) })} aria-label="Jumlah" />
        <button type="button" className="abu" onClick={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : rows)} aria-label="Hapus baris"><i className="bi bi-x-lg" /></button>
      </div>))}
    <button type="button" className="btn kecil abu" onClick={() => setRows([...rows, { jenis_id: '', jumlah: 1 }])}><i className="bi bi-plus-lg" /> Tambah barang</button>
    <input type="hidden" name={name} value={JSON.stringify(rows.filter(r => r.jenis_id && r.jumlah > 0))} />
  </div>)
}
