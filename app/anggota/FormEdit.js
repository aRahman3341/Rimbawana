'use client'
import Link from 'next/link'
import { useFormState } from 'react-dom'
import { simpanAnggota, resetPassword, hapusAnggota } from './kelola'
import { STATUS, PERAN } from '@/lib/akun'
import { labelAngkatan } from '@/lib/angkatan'
export default function FormEdit({ a, angkatan, ketua, bolehHapus }) {
  const [s, aksi] = useFormState(simpanAnggota, null)
  const [r, aksiR] = useFormState(resetPassword, null)
  const founder = a.peran === 'founder'
  return (<>
    <form className="form" action={aksi}><input type="hidden" name="id" value={a.id} />
      <div className="grid">
        <div><label>Nama lengkap</label><input name="nama_lengkap" defaultValue={a.nama_lengkap} required /></div>
        <div><label>Nama adat (untuk login)</label><input name="nama_adat" defaultValue={a.nama_adat} required /></div>
        <div><label>Status</label><select name="status" defaultValue={a.status || ''}><option value="">-</option>{Object.entries(STATUS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
        <div><label>Jabatan</label><select name="jabatan" defaultValue={a.jabatan}><option value="anggota">Anggota</option><option value="pengurus">Pengurus</option><option value="alumni">{founder ? 'Alumni' : 'Alumni (akun dihapus)'}</option></select></div>
        {ketua && !founder && <div><label>Peran pengurus</label><select name="peran" defaultValue={a.peran}>{Object.entries(PERAN).filter(([k]) => k !== 'founder').map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>}
        {<div><label>Angkatan</label><select name="angkatan_id" defaultValue={a.angkatan_id || ''}><option value="">-</option>{angkatan.map(g => <option key={g.id} value={g.id}>{labelAngkatan(g)}</option>)}</select></div>}
        <div><label>NTA</label><input name="nta" defaultValue={a.nta || ''} /></div>
        <div><label>No HP</label><input name="no_hp" defaultValue={a.no_hp || ''} /></div>
        <div><label>Email (opsional)</label><input name="email" type="email" defaultValue={a.email || ''} /></div>
        {!a.user_id && <div><label>Password awal (anggota belum punya akun)</label><input name="password" type="password" autoComplete="new-password" /></div>}
      </div>
      <label><input type="checkbox" name="aktif" defaultChecked={a.aktif} style={{ width: 'auto', marginRight: 8 }} />Akun aktif (boleh login)</label>
      <p className="err">{s?.error}</p><p>{s?.ok}</p>
      <button>Simpan</button> <Link className="btn kuning" href="/anggota">Kembali</Link>
    </form>
    {a.user_id && <form className="form" action={aksiR}><input type="hidden" name="id" value={a.id} />
      <h2>Atur Ulang Password</h2><label>Password sementara baru</label><input name="password" type="password" autoComplete="new-password" />
      <p className="err">{r?.error}</p><p>{r?.ok}</p><button>Atur Ulang</button></form>}
    {bolehHapus && <form className="form" action={hapusAnggota}><input type="hidden" name="id" value={a.id} />
      <h2>Hapus Anggota</h2><p>Menghapus data dan akun login anggota ini secara permanen.</p>
      <button className="bahaya" onClick={(e) => { if (!confirm('Hapus anggota ini beserta akunnya? Tidak bisa dibatalkan.')) e.preventDefault() }}>Hapus Anggota</button></form>}
  </>)
}
