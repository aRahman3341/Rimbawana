'use client'
import { useFormState } from 'react-dom'
import { masuk } from './actions'
import InputPassword from '@/components/InputPassword'

export default function LoginForm({ logo }) {
  const [s, aksi] = useFormState(masuk, null)
  return (
    <div className="split">
      <div className="kiri">
        <form className="kartu" action={aksi}>
          <h1 className="tampil-disp" style={{ color: "var(--hutan)" }}>Masuk Anggota</h1>
          <label>Nama adat</label>
          <input name="nama_adat" autoComplete="username" required />
          <label>Password</label>
          <InputPassword name="password" autoComplete="current-password" />
          <p className="err">{s?.error}</p>
          <button style={{ width: "100%" }}>Masuk</button>
          <p style={{ textAlign: "center", marginBottom: 0 }}><a href="/">&larr; Kembali ke situs</a></p>
        </form>
      </div>
      <div className="kanan">
        <img src={logo} alt="Rimbawana" />
        <h2>UKM Rimbawana</h2>
        <p>UPI Kampus di Cibiru</p>
      </div>
    </div>
  )
}