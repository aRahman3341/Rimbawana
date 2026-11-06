'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Unggah langsung dari browser ke Supabase Storage (tidak lewat server, jadi tidak kena batas ukuran Vercel).
// Hasilnya (path) dikirim bersama formulir lewat <input type="hidden" name={name}>.
export default function UnggahBerkas({ name, bucket = 'arsip', folder = 'umum', accept = 'application/pdf', label = 'Berkas', bantuan }) {
  const [path, setPath] = useState('')
  const [st, setSt] = useState('')
  const kotak = useRef(null)
  useEffect(() => {                      // ikut kosong ketika formulir di-reset
    const form = kotak.current?.closest('form')
    const kosongkan = () => { setPath(''); setSt('') }
    form?.addEventListener('reset', kosongkan)
    return () => form?.removeEventListener('reset', kosongkan)
  }, [])
  async function pilih(e) {
    const f = e.target.files?.[0]
    if (!f) { setPath(''); setSt(''); return }
    const maks = bucket === 'foto' ? 3 : 10
    if (f.size > maks * 1024 * 1024) { setSt(`Terlalu besar (maksimal ${maks} MB).`); e.target.value = ''; setPath(''); return }
    setSt('Mengunggah...')
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
    const p = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`
    const { error } = await createClient().storage.from(bucket).upload(p, f, { contentType: f.type, upsert: false })
    if (error) { setSt('Gagal mengunggah: ' + error.message); setPath(''); return }
    setPath(p); setSt('Terunggah: ' + f.name)
  }
  return (<div ref={kotak}>
    <label>{label}</label>
    <input type="file" accept={accept} onChange={pilih} />
    <input type="hidden" name={name} value={path} />
    <small>{st || bantuan}</small>
  </div>)
}
