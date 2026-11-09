import Link from 'next/link'
import Shell from '@/components/Shell'
import MintaAkses from '@/components/MintaAkses'
import FormAksi from '@/components/FormAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { rupiah, tgl, STATUS_RAB } from '@/lib/format'
import { tambahKegiatan } from './actions'
export const dynamic = 'force-dynamic'

export default async function Kegiatan() {
  const saya = await wajibMasuk('lihat')
  const adm = admin()
  const [daftar, keluar] = await Promise.all([
    adm.from('kegiatan_rab').select('*').order('created_at', { ascending: false }).then(ambil),
    adm.from('buku_kas').select('kegiatan_id,jumlah').eq('tipe', 'keluar').not('kegiatan_id', 'is', null).then(ambil)])
  const real = {}; keluar.forEach(t => { real[t.kegiatan_id] = (real[t.kegiatan_id] || 0) + Number(t.jumlah) })
  return (<Shell aktif="kegiatan" judul="RAB Kegiatan">
    {!(boleh(saya, 'pengurus')) && <MintaAkses izin="pengurus" />}
    {boleh(saya, 'pengurus') && <details className="tambah"><summary className="btn"><i className="bi bi-plus-lg" /> Ajukan Kegiatan &amp; RAB</summary>
      <FormAksi aksi={tambahKegiatan} className="form" tombol="Simpan" reset={false}>
        <div className="grid">
          <div><label>Nama kegiatan</label><input name="nama" required maxLength={120} placeholder="Mabim Panjat Tebing" /></div>
          <div><label>Tempat</label><input name="tempat" maxLength={120} /></div>
          <div><label>Tanggal mulai</label><input type="date" name="tgl_mulai" /></div>
          <div><label>Tanggal selesai</label><input type="date" name="tgl_selesai" /></div>
          <div><label>Total anggaran RAB (Rp)</label><input name="total_rab" inputMode="numeric" /></div>
        </div>
        <label>Deskripsi singkat</label><textarea name="deskripsi" maxLength={500} />
        <UnggahBerkas name="rab" folder="rab" drive label="Berkas RAB" bantuan="Jika diunggah, RAB langsung diajukan ke Ketua Adat untuk di-ACC." />
      </FormAksi></details>}

    <div className="kisi">
      {daftar.length === 0 && <p className="kosong">Belum ada kegiatan.</p>}
      {daftar.map(k => { const [w, lb] = STATUS_RAB[k.status_rab]; const r = real[k.id] || 0
        const pct = k.total_rab > 0 ? Math.min(Math.round(r / k.total_rab * 100), 999) : 0
        return (<Link key={k.id} href={`/kegiatan/${k.id}`} className="kotak" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className={`lencana ${w}`}>{lb}</span>
          <h3 style={{ margin: '10px 0 2px' }}>{k.nama}</h3>
          <p className="redup" style={{ margin: '0 0 10px' }}>{k.tgl_mulai ? tgl(k.tgl_mulai) : 'Tanggal belum diisi'}{k.tempat ? ` - ${k.tempat}` : ''}</p>
          <div className={`bar ${pct > 100 ? 'lebih' : pct > 85 ? 'waspada' : ''}`}><i style={{ width: `${Math.min(pct, 100)}%` }} /></div>
          <p style={{ margin: '8px 0 0', fontSize: '.88rem' }}>Terpakai <b>{rupiah(r)}</b> dari {rupiah(k.total_rab)} ({pct}%)</p>
        </Link>) })}
    </div>
  </Shell>)
}
