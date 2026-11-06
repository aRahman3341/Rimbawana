'use client'
// Tombol kecil untuk server action sederhana (hapus, setujui, dll). data = isian tersembunyi.
export default function TombolAksi({ aksi, data = {}, teks, ikon, konfirmasi, cls = 'kecil', title }) {
  return (
    <form action={aksi} style={{ display: 'inline' }}
      onSubmit={konfirmasi ? (e) => { if (!confirm(konfirmasi)) e.preventDefault() } : undefined}>
      {Object.entries(data).map(([k, v]) => <input key={k} type="hidden" name={k} value={v ?? ''} />)}
      <button className={cls} title={title}>{ikon && <i className={`bi bi-${ikon}`} />}{teks && ` ${teks}`}</button>
    </form>)
}
