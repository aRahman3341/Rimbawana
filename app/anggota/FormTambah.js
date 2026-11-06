'use client'
import { useFormState } from 'react-dom'
import { tambahAnggota } from './actions'
import { STATUS, PERAN } from '@/lib/akun'
export default function FormTambah({ angkatan, ketua }) {
  const [s, aksi] = useFormState(tambahAnggota, null)
  return (<form className="form" action={aksi}><h2>Tambah Anggota</h2><div className="grid">
    <div><label>Nama lengkap</label><input name="nama_lengkap" required /></div>
    <div><label>Nama adat (untuk login)</label><input name="nama_adat" required /></div>
    <div><label>Status</label><select name="status"><option value="">-</option>{Object.entries(STATUS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
    <div><label>Jabatan</label><select name="jabatan"><option value="anggota">Anggota</option><option value="pengurus">Pengurus</option><option value="alumni">Alumni (tanpa akun)</option></select></div>
    <div><label>Peran pengurus</label><select name="peran" disabled={!ketua}>{Object.entries(PERAN).filter(([k]) => k !== 'founder').map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
    <div><label>NTA (opsional)</label><input name="nta" /></div>
    <div><label>Angkatan</label><select name="angkatan_id" disabled={!ketua}><option value="">-</option>{angkatan.map(a => <option key={a.id} value={a.id}>{a.kode} - {a.nama}</option>)}</select></div>
    <div><label>No HP</label><input name="no_hp" /></div>
    <div><label>Email (opsional)</label><input name="email" type="email" /></div>
    <div><label>Password awal</label><input name="password" type="password" autoComplete="new-password" /></div>
  </div>{!ketua && <p>Peran pengurus dan angkatan hanya diisi Ketua Adat atau Founder.</p>}
  <p className="err">{s?.error}</p><p>{s?.ok}</p><button>Simpan</button></form>)
}
