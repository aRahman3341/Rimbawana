import Link from 'next/link'
import { notFound } from 'next/navigation'
import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import UnggahBerkas from '@/components/UnggahBerkas'
import { wajibMasuk, boleh } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { urlArsip } from '@/lib/berkas'
import { rupiah, tgl, STATUS_RAB } from '@/lib/format'
import { ubahKegiatan, ajukanRab, putuskanRab, bukaRab, hapusKegiatan } from '../actions'
export const dynamic = 'force-dynamic'

export default async function DetailKegiatan({ params }) {
  const saya = await wajibMasuk('pengurus')
  const ketua = boleh(saya, 'keputusan')
  const adm = admin()
  const k = ambil(await adm.from('kegiatan_rab').select('*, pemutus:anggota!diputuskan_oleh(nama_adat)').eq('id', params.id).maybeSingle())
  if (!k) notFound()
  const [keluar, surat] = await Promise.all([
    adm.from('buku_kas').select('id,tanggal,jumlah,keterangan').eq('kegiatan_id', k.id).eq('tipe', 'keluar').order('tanggal', { ascending: false }).then(ambil),
    adm.from('surat_arsip').select('id,nomor,perihal').eq('kegiatan_id', k.id).then(ambil)])
  const url = await urlArsip([k.rab_path])
  const [w, lb] = STATUS_RAB[k.status_rab]
  const real = keluar.reduce((a, t) => a + Number(t.jumlah), 0)
  const pct = k.total_rab > 0 ? Math.round(real / k.total_rab * 100) : 0
  const kunci = k.status_rab === 'disetujui'
  return (<Shell aktif="kegiatan" judul={k.nama}>
    <div className="baris"><Link className="btn kecil abu" href="/kegiatan"><i className="bi bi-arrow-left" /> Kembali</Link><span className={`lencana ${w}`}>{lb}</span></div>
    <div className="dua">
      <div className="form">
        <h2>Ringkasan</h2>
        <p>{k.tgl_mulai ? `${tgl(k.tgl_mulai)}${k.tgl_selesai ? ` - ${tgl(k.tgl_selesai)}` : ''}` : 'Tanggal belum diisi'}{k.tempat && ` | ${k.tempat}`}</p>
        {k.deskripsi && <p>{k.deskripsi}</p>}
        <p style={{ margin: '12px 0 4px' }}>Anggaran RAB: <b>{rupiah(k.total_rab)}</b></p>
        <div className={`bar ${pct > 100 ? 'lebih' : pct > 85 ? 'waspada' : ''}`}><i style={{ width: `${Math.min(pct, 100)}%` }} /></div>
        <p style={{ margin: '6px 0 0' }}>Terpakai <b>{rupiah(real)}</b> ({pct}%) &middot; sisa <b>{rupiah(k.total_rab - real)}</b></p>
        {url[k.rab_path] ? <p style={{ marginTop: 14 }}><a className="btn kuning" href={url[k.rab_path]} target="_blank" rel="noreferrer"><i className="bi bi-file-earmark-pdf" /> Buka RAB (PDF)</a></p> : <p className="redup" style={{ marginTop: 14 }}>Belum ada berkas RAB.</p>}
        {surat.map(s => <p key={s.id} style={{ margin: '8px 0 0' }}><i className="bi bi-envelope-paper" /> {s.nomor} - {s.perihal}</p>)}
        {k.status_rab === 'draft' && k.rab_path && <p style={{ marginTop: 12 }}><TombolAksi aksi={ajukanRab} data={{ id: k.id }} teks="Ajukan ke Ketua Adat" cls="btn" /></p>}
        {k.tgl_keputusan && <p className="redup" style={{ marginTop: 12 }}>Keputusan oleh {k.pemutus?.nama_adat || '-'} pada {tgl(k.tgl_keputusan)}{k.catatan_keputusan && <>: &ldquo;{k.catatan_keputusan}&rdquo;</>}</p>}
      </div>

      <div>
        {ketua && k.status_rab === 'diajukan' && <FormAksi aksi={putuskanRab} className="form" tombol="ACC RAB" reset={false}>
          <h2>Keputusan Ketua Adat</h2><input type="hidden" name="id" value={k.id} /><input type="hidden" name="setuju" value="1" />
          <label>Catatan (opsional)</label><input name="catatan" maxLength={200} /></FormAksi>}
        {ketua && k.status_rab === 'diajukan' && <FormAksi aksi={putuskanRab} className="form" tombol="Tolak" bahaya reset={false}>
          <input type="hidden" name="id" value={k.id} /><input type="hidden" name="setuju" value="0" />
          <label>Alasan penolakan (wajib)</label><input name="catatan" maxLength={200} /></FormAksi>}
        {ketua && kunci && <p><TombolAksi aksi={bukaRab} data={{ id: k.id }} teks="Buka kembali untuk revisi" cls="kecil abu" konfirmasi="Buka RAB ini untuk direvisi? Statusnya kembali ke Ditolak." /></p>}

        {!kunci && <FormAksi aksi={ubahKegiatan} className="form" tombol="Simpan Perubahan" reset={false}>
          <h2>{k.status_rab === 'ditolak' ? 'Revisi RAB' : 'Ubah data'}</h2><input type="hidden" name="id" value={k.id} />
          <label>Nama kegiatan</label><input name="nama" defaultValue={k.nama} required />
          <div className="grid"><div><label>Tempat</label><input name="tempat" defaultValue={k.tempat || ''} /></div>
            <div><label>Total RAB (Rp)</label><input name="total_rab" inputMode="numeric" defaultValue={k.total_rab} /></div>
            <div><label>Mulai</label><input type="date" name="tgl_mulai" defaultValue={k.tgl_mulai || ''} /></div>
            <div><label>Selesai</label><input type="date" name="tgl_selesai" defaultValue={k.tgl_selesai || ''} /></div></div>
          <label>Deskripsi</label><textarea name="deskripsi" defaultValue={k.deskripsi || ''} />
          <UnggahBerkas name="rab" folder="rab" label="Unggah RAB baru (PDF)" bantuan="Mengunggah RAB baru otomatis mengajukannya lagi ke Ketua Adat." />
        </FormAksi>}
        {ketua && !kunci && <FormAksi aksi={hapusKegiatan} className="form" tombol="Hapus Kegiatan" bahaya konfirmasi="Hapus kegiatan ini?"><input type="hidden" name="id" value={k.id} /></FormAksi>}
      </div>
    </div>

    <h2 style={{ margin: '22px 0 10px' }}>Pengeluaran kegiatan</h2>
    <div className="tabel"><table><thead><tr><th>Tanggal</th><th>Keterangan</th><th className="angka">Jumlah</th></tr></thead><tbody>
      {keluar.length === 0 && <tr><td colSpan={3} className="kosong">{kunci ? 'Belum ada pengeluaran. Catat di menu Buku Kas.' : 'Pengeluaran bisa dicatat setelah RAB disetujui.'}</td></tr>}
      {keluar.map(t => <tr key={t.id}><td>{tgl(t.tanggal)}</td><td className="bungkus">{t.keterangan || '-'}</td><td className="angka">{rupiah(t.jumlah)}</td></tr>)}
    </tbody></table></div>
  </Shell>)
}
