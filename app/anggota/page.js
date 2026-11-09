import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Shell from '@/components/Shell'
import FormTambah from './FormTambah'
import { STATUS, PERAN, bolehKelola } from '@/lib/akun'
export const dynamic = 'force-dynamic'
export default async function Anggota() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: daftar }, { data: angkatan }, { data: admin }, { data: ketua }, { data: saya }] = await Promise.all([
    sb.from('anggota').select('id,nama_adat,nama_lengkap,status,jabatan,peran,nta,no_hp,aktif,angkatan(kode,nama)').order('nama_adat'),
    sb.from('angkatan').select('id,kode,nama,tahun').order('tahun', { nullsFirst: false }).order('nama'),
    sb.rpc('is_admin_anggota'), sb.rpc('is_ketua'), sb.rpc('peran_saya')])
  return (<Shell aktif="anggota" judul="Daftar Anggota">
    {admin && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Tambah Anggota</summary>
      <FormTambah angkatan={angkatan || []} ketua={!!ketua} /></details>}
    <div className="tabel"><table><thead><tr><th>No</th><th>Nama adat</th><th>Nama lengkap</th><th>Status</th><th>Jabatan</th><th>Angkatan</th><th>NTA</th><th>No HP</th>{admin && <th></th>}</tr></thead>
      <tbody>{(daftar || []).filter(a => a.peran !== 'founder' || saya === 'founder').map((a, i) => (<tr key={a.id}>
        <td>{i + 1}</td><td>{a.nama_adat}</td><td>{a.nama_lengkap}</td><td>{STATUS[a.status] || '-'}</td>
        <td>{a.jabatan}{a.peran !== 'anggota' ? ` (${PERAN[a.peran]})` : ''}</td><td>{a.angkatan?.kode || a.angkatan?.nama || '-'}</td><td>{a.nta || '-'}</td><td>{a.no_hp || '-'}</td>{admin && <td>{bolehKelola(saya, a.peran) && <Link className="btn kecil" href={`/anggota/${a.id}`}>Edit</Link>}</td>}</tr>))}</tbody></table></div>
  </Shell>)
}
