import { admin, ambil } from '@/lib/db'
import FormPinjam from './FormPinjam'
import { hariIni, tambahHari } from '@/lib/format'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pinjam Alat' }

export default async function Pinjam({ searchParams }) {
  const jenis = ambil(await admin().from('v_stok_jenis').select('id,nama,divisi,tersedia').gt('tersedia', 0).order('divisi').order('nama'))
  const awal = jenis.some(j => j.id === searchParams.jenis) ? [{ jenis_id: searchParams.jenis, jumlah: 1 }] : []
  return (<section className="seksi" style={{ maxWidth: 760 }}>
    <h2 className="jdl">Pinjam Alat</h2>
    <p className="lead">Isi formulir ini untuk meminjam alat Rimbawana. Tidak perlu login. Pengurus perlengkapan akan menghubungi nomor WhatsApp kamu untuk menyerahkan alat.</p>
    <FormPinjam jenis={jenis} awal={awal} hariIni={hariIni()} besok={tambahHari(3)} />
  </section>)
}
