import Shell from '@/components/Shell'
import FormAksi from '@/components/FormAksi'
import TombolAksi from '@/components/TombolAksi'
import { wajibFounder, DAFTAR_IZIN, PERAN_ATUR, judulIzin, muatIzin } from '@/lib/auth'
import { admin, ambil } from '@/lib/db'
import { PERAN } from '@/lib/akun'
import { tgl } from '@/lib/format'
import { simpanMatriks, tambahHakOrang, cabutHakOrang, putuskanPermintaan } from './actions'
export const dynamic = 'force-dynamic'

export default async function Akses() {
  await wajibFounder()
  const adm = admin()
  const izin = await muatIzin()
  const [permintaan, hak, anggota] = await Promise.all([
    adm.from('akses_permintaan').select('*, anggota:anggota!anggota_id(nama_adat,peran)').order('created_at', { ascending: false }).limit(60).then(r => r.error ? [] : r.data),
    adm.from('akses_pengguna').select('anggota_id,izin,alasan,created_at, anggota:anggota!anggota_id(nama_adat,peran)').order('created_at', { ascending: false }).then(r => r.error ? [] : r.data),
    adm.from('anggota').select('id,nama_adat,peran').eq('aktif', true).neq('peran', 'founder').order('nama_adat').then(ambil)])
  const baru = permintaan.filter(p => p.status === 'baru'), lama = permintaan.filter(p => p.status !== 'baru')
  return (<Shell aktif="akses" judul="Akses & CS Founder">
    {!izin.dariDb && <div className="form" style={{ borderColor: 'var(--api)' }}><b>Pengaturan masih memakai pembagian bawaan.</b> Jalankan <code>supabase/07_akses_cs_founder.sql</code> di Supabase, lalu muat ulang halaman ini. Halaman ini hanya terlihat olehmu.</div>}

    <h2 style={{ margin: '0 0 10px' }}>Permintaan masuk ({baru.length})</h2>
    {baru.length === 0 && <p className="kosong">Tidak ada permintaan baru.</p>}
    <div className="dua">
      {baru.map(p => (<div className="form" key={p.id} style={{ margin: 0 }}>
        <div className="baris" style={{ marginBottom: 6 }}><b>{p.anggota?.nama_adat}</b><span className="lencana coklat">{PERAN[p.anggota?.peran]}</span><small className="ms-auto">{tgl(p.created_at)}</small></div>
        <p style={{ margin: '0 0 6px' }}>{p.izin ? <>Minta izin <span className="lencana biru">{judulIzin(p.izin)}</span></> : <span className="lencana">Bantuan lain</span>}</p>
        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{p.pesan}</p>
        <FormAksi aksi={putuskanPermintaan} tombol={p.izin ? 'Setujui, beri izin' : 'Tandai selesai'} kecil reset={false}>
          <input type="hidden" name="id" value={p.id} /><input type="hidden" name="aksi" value="setuju" />
          <label>Balasan (opsional)</label><input name="balasan" maxLength={300} /></FormAksi>
        <FormAksi aksi={putuskanPermintaan} tombol="Tolak" kecil bahaya reset={false}>
          <input type="hidden" name="id" value={p.id} /><input type="hidden" name="aksi" value="tolak" /><input name="balasan" maxLength={300} placeholder="Alasan penolakan" /></FormAksi>
      </div>))}
    </div>

    <h2 style={{ margin: '26px 0 4px' }}>Izin per peran</h2>
    <p className="redup" style={{ margin: '0 0 10px' }}>Centang izin yang dimiliki tiap peran. Berlaku langsung setelah disimpan. Kamu (Founder) selalu punya semua izin.</p>
    <FormAksi aksi={simpanMatriks} className="" tombol="Simpan Izin Peran" reset={false}>
      <div className="tabel"><table>
        <thead><tr><th>Izin</th>{PERAN_ATUR.map(r => <th key={r} style={{ textAlign: 'center' }}>{PERAN[r] === '-' ? 'Anggota' : PERAN[r]}</th>)}</tr></thead>
        <tbody>{DAFTAR_IZIN.map(i => (<tr key={i.kunci}>
          <td className="bungkus"><b>{i.judul}</b><small><br />{i.ket}</small></td>
          {PERAN_ATUR.map(r => <td key={r} style={{ textAlign: 'center' }}><input type="checkbox" name={`m__${i.kunci}__${r}`} defaultChecked={izin.peran[i.kunci]?.has(r)} aria-label={`${i.judul} untuk ${r}`} /></td>)}
        </tr>))}</tbody></table></div>
      <p className="redup" style={{ margin: '8px 0 12px' }}>Catatan: &quot;Melihat halaman pengurus&quot; perlu dicentang agar peran itu bisa membuka menu pengurus dan chat.</p>
    </FormAksi>

    <h2 style={{ margin: '26px 0 10px' }}>Izin tambahan per orang</h2>
    <div className="dua">
      <FormAksi aksi={tambahHakOrang} className="form" tombol="Beri Izin">
        <label>Orang</label><select name="anggota_id" required><option value="">-</option>{anggota.map(a => <option key={a.id} value={a.id}>{a.nama_adat} ({PERAN[a.peran] === '-' ? 'Anggota' : PERAN[a.peran]})</option>)}</select>
        <label>Izin</label><select name="izin" required>{DAFTAR_IZIN.map(i => <option key={i.kunci} value={i.kunci}>{i.judul}</option>)}</select>
        <label>Alasan (opsional)</label><input name="alasan" maxLength={200} />
      </FormAksi>
      <div className="tabel"><table><thead><tr><th>Orang</th><th>Izin tambahan</th><th></th></tr></thead><tbody>
        {hak.length === 0 && <tr><td colSpan={3} className="kosong">Belum ada.</td></tr>}
        {hak.map(h => <tr key={h.anggota_id + h.izin}><td><b>{h.anggota?.nama_adat}</b> <small>{PERAN[h.anggota?.peran]}</small></td><td className="bungkus">{judulIzin(h.izin)}{h.alasan && <small><br />{h.alasan}</small>}</td>
          <td><TombolAksi aksi={cabutHakOrang} data={{ anggota_id: h.anggota_id, izin: h.izin }} ikon="x-lg" cls="kecil bahaya" konfirmasi="Cabut izin ini?" /></td></tr>)}
      </tbody></table></div>
    </div>

    {lama.length > 0 && <><h2 style={{ margin: '26px 0 10px' }}>Riwayat permintaan</h2>
      <div className="tabel"><table><thead><tr><th>Tanggal</th><th>Orang</th><th>Permintaan</th><th>Status</th><th>Balasan</th></tr></thead><tbody>
        {lama.map(p => <tr key={p.id}><td>{tgl(p.created_at)}</td><td>{p.anggota?.nama_adat}</td><td className="bungkus">{p.izin ? judulIzin(p.izin) : 'Bantuan lain'}</td>
          <td><span className={`lencana ${p.status === 'disetujui' ? 'hijau' : 'merah'}`}>{p.status}</span></td><td className="bungkus">{p.balasan || '-'}</td></tr>)}</tbody></table></div></>}
  </Shell>)
}
