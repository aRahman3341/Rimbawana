'use client'
import { useState } from 'react'

export default function InputPassword({ name, autoComplete, required = true }) {
  const [lihat, setLihat] = useState(false)
  return (
    <div className="pw">
      <input name={name} type={lihat ? 'text' : 'password'} autoComplete={autoComplete} required={required} />
      <button
        type="button"
        className="mata"
        onClick={() => setLihat(!lihat)}
        aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        <i className={`bi bi-eye${lihat ? '-slash' : ''}`} />
      </button>
    </div>
  )
}