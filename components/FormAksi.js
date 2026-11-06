'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef } from 'react'

function Tombol({ teks, cls }) {
  const { pending } = useFormStatus()
  return <button className={cls} disabled={pending}>{pending ? 'Memproses...' : teks}</button>
}
// Pembungkus formulir untuk server action (state: { error } / { ok }). Kosongkan isian setelah sukses.
export default function FormAksi({ aksi, tombol = 'Simpan', bahaya = false, kecil = false, konfirmasi, reset = true, className = '', children }) {
  const [s, f] = useFormState(aksi, null)
  const ref = useRef(null)
  useEffect(() => { if (s?.ok && reset) ref.current?.reset() }, [s, reset])
  return (
    <form ref={ref} action={f} className={className}
      onSubmit={konfirmasi ? (e) => { if (!confirm(konfirmasi)) e.preventDefault() } : undefined}>
      {children}
      {s?.error && <p className="err">{s.error}</p>}
      {s?.ok && <p className="ok">{s.ok}</p>}
      <Tombol teks={tombol} cls={`${bahaya ? 'bahaya' : ''} ${kecil ? 'kecil' : ''}`} />
    </form>)
}
