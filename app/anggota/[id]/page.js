import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Shell from '@/components/Shell'
import FormEdit from '../FormEdit'
import { bolehKelola } from '@/lib/akun'
export const dynamic = 'force-dynamic'
export default async function Edit({ params }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: saya }, { data: admin }, { data: ketua }, { data: a }, { data: angkatan }] = await Promise.all([
    sb.rpc('peran_saya'), sb.rpc('is_admin_anggota'), sb.rpc('is_ketua'),
    sb.from('anggota').select('*').eq('id', params.id).maybeSingle(),
    sb.from('angkatan').select('id,kode,nama,tahun').order('tahun', { nullsFirst: false }).order('nama')])
  if (!admin || !a || (a.peran === 'founder' && saya !== 'founder')) notFound()
  if (!bolehKelola(saya, a.peran)) redirect('/anggota')
  return (<Shell aktif="anggota" judul={`Edit: ${a.nama_adat}`}>
    <FormEdit a={a} angkatan={angkatan || []} ketua={!!ketua} bolehHapus={a.peran !== 'founder' && a.user_id !== user.id} />
  </Shell>)
}
