'use client'
import FormAksi from '@/components/FormAksi'
import BarisBarang from '@/components/BarisBarang'
import { ajukanPinjam } from './actions'

export default function FormPinjam({ jenis, awal, hariIni, besok }) {
  return (
    <FormAksi aksi={ajukanPinjam} tombol="Kirim Permintaan" className="form" reset>
      <div className="grid">
        <div><label>Nama lengkap</label><input name="nama" required maxLength={80} /></div>
        <div><label>Nama adat (jika anggota)</label><input name="adat" maxLength={60} /></div>
        <div><label>No WhatsApp</label><input name="hp" inputMode="tel" required maxLength={20} placeholder="08xxxxxxxxxx" /></div>
        <div><label>Tanggal pinjam</label><input name="tgl_pinjam" type="date" min={hariIni} defaultValue={hariIni} required /></div>
        <div><label>Rencana kembali</label><input name="tgl_kembali" type="date" min={hariIni} defaultValue={besok} required /></div>
      </div>
      <label>Keperluan</label><textarea name="keperluan" required maxLength={300} placeholder="Contoh: latihan panjat tebing, pendakian, kegiatan prodi" />
      <label>Alat yang dipinjam</label>
      <BarisBarang jenis={jenis} awal={awal} />
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <p className="redup" style={{ margin: '12px 0 0' }}>Alat harus dikembalikan sesuai rencana. Kerusakan atau kehilangan menjadi tanggung jawab peminjam.</p>
    </FormAksi>)
}
