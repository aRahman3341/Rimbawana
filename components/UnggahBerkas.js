'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Pilih berkas: unggah langsung ke Supabase Storage (maks 50 MB) ATAU, jika drive=true, tempel link Google Drive (maks 100 MB).
// Kirim lewat formulir: <name> = path Storage, <name>_drive = link Drive. File tidak pernah disimpan di database.
export default function UnggahBerkas({ name, bucket = 'arsip', folder = 'umum', accept = 'application/pdf', label = 'Berkas', bantuan, drive = false }) {
  const [mode, setMode] = useState('unggah')
  const [path, setPath] = useState('')
  const [st, setSt] = useState('')
  const kotak = useRef(null)
  const maks = bucket === 'foto' ? 10 : 50
  useEffect(() => {
    const form = kotak.current?.closest('form')
    const kosongkan = () => { setPath(''); setSt(''); setMode('unggah') }
    form?.addEventListener('reset', kosongkan)
    return () => form?.removeEventListener('reset', kosongkan)
  }, [])
  async function pilih(e) {
    const f = e.target.files?.[0]
    if (!f) { setPath(''); setSt(''); return }
    if (f.size > maks * 1024 * 1024) {
      e.target.value = ''; setPath('')
      if (drive) { setMode('drive'); setSt(`Lebih dari ${maks} MB. Unggah ke Google Drive lalu tempel linknya di sini (maks 100 MB).`) }
      else setSt(`Terlalu besar (maksimal ${maks} MB).`)
      return
    }
    setSt('Mengunggah...')
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
    const p = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`
    const { error } = await createClient().storage.from(bucket).upload(p, f, { contentType: f.type, upsert: false })
    if (error) { setSt('Gagal mengunggah: ' + error.message); setPath(''); return }
    setPath(p); setSt('Terunggah: ' + f.name)
  }
  return (<div ref={kotak}>
    <label>{label}</label>
    {drive && <div className="tabs" style={{ marginBottom: 8 }}>
      <button type="button" className={`tab ${mode === 'unggah' ? 'aktif' : ''}`} onClick={() => setMode('unggah')}>Unggah file (maks {maks} MB)</button>
      <button type="button" className={`tab ${mode === 'drive' ? 'aktif' : ''}`} onClick={() => { setMode('drive'); setPath('') }}>Link Google Drive (maks 100 MB)</button>
    </div>}
    {mode === 'unggah' ? (<>
      <input type="file" accept={accept} onChange={pilih} />
      <input type="hidden" name={name} value={path} />
    </>) : (<>
      <input name={`${name}_drive`} type="url" placeholder="https://drive.google.com/file/d/..." />
      <small>Di Drive: Bagikan, ubah akses umum menjadi &quot;Siapa saja yang memiliki link&quot;, lalu salin link. Sistem akan memastikan file itu ada.</small>
    </>)}
    <small style={{ display: 'block' }}>{st || bantuan}</small>
  </div>)
}
