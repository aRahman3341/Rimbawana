import { admin, ambil } from '@/lib/db'
import PinjamSederhana from './PinjamSederhana'
import { hariIni, tambahHari } from '@/lib/format'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pinjam Alat' }

export default async function Pinjam({ searchParams }) {
  const jenis = ambil(await admin().from('v_stok_jenis').select('id,nama,divisi,bebas,keterangan').gt('bebas', 0).eq('sembunyikan', false).order('divisi').order('nama'))
  const awal = jenis.some(j => j.id === searchParams.jenis) ? searchParams.jenis : null
  return (<section className="seksi" style={{ maxWidth: 720 }}>
    <h2 className="jdl">Pinjam Alat</h2>
    <p className="lead">Pilih alat, isi data singkat, lalu kirim. Tidak perlu login. Alat yang sedang dipinjam otomatis tidak tampil.</p>
    <PinjamSederhana jenis={jenis} awal={awal} hariIni={hariIni()} besok={tambahHari(3)} />
  </section>)
}
