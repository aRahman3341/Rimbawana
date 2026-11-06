const TZ = 'Asia/Jakarta'
export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
export const tgl = (d) => d ? new Date(d).toLocaleDateString('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }) : '-'
export const bulanTahun = (d) => d ? new Date(d).toLocaleDateString('id-ID', { timeZone: TZ, month: 'long', year: 'numeric' }) : '-'
export const hariIni = () => new Date().toLocaleDateString('sv-SE', { timeZone: TZ })          // YYYY-MM-DD (waktu WIB)
export const awalBulan = (d = hariIni()) => d.slice(0, 7) + '-01'
export const tambahHari = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toLocaleDateString('sv-SE', { timeZone: TZ }) }
export const DIVISI = { RC: 'Panjat Tebing (RC)', HG: 'Hutan Gunung (HG)', PLH: 'Pendidikan Lingkungan Hidup', UMUM: 'Umum' }
// Nomor HP -> tautan WhatsApp (0812... menjadi 62812...)
export const waLink = (hp) => { const d = String(hp || '').replace(/\D/g, ''); const n = d.startsWith('0') ? '62' + d.slice(1) : d; return n ? `https://wa.me/${n}` : null }
export const TIPE_PINJAM = { anggota: 'Anggota / perorangan', mapala_pinjam: 'Mapala lain pinjam ke kita', kita_pinjam: 'Kita pinjam ke mapala lain' }
export const STATUS_PINJAM = { menunggu: ['kuning', 'Menunggu'], dipinjam: ['biru', 'Dipinjam'], dikembalikan: ['hijau', 'Dikembalikan'], ditolak: ['merah', 'Ditolak'] }
export const KATEGORI_SURAT = { undangan: 'Undangan', peminjaman: 'Peminjaman alat', proposal: 'Proposal kegiatan', lpj: 'LPJ', pemberitahuan: 'Pemberitahuan', permohonan: 'Permohonan', lainnya: 'Lainnya' }
// Daftar awal-bulan (YYYY-MM-01) dari `mulai` sampai bulan `sampai` (maks. 36 bulan terakhir).
export function daftarBulan(mulai, sampai = hariIni()) {
  const out = []; let [y, m] = mulai.slice(0, 7).split('-').map(Number); const [ey, em] = sampai.slice(0, 7).split('-').map(Number)
  while ((y < ey || (y === ey && m <= em)) && out.length < 36) { out.push(`${y}-${String(m).padStart(2, '0')}-01`); if (++m > 12) { m = 1; y++ } }
  return out
}
export const KATEGORI_KAS = { iuk: 'IUK / dana kampus', kegiatan: 'Kegiatan (sesuai RAB)', operasional: 'Operasional', lainnya: 'Lainnya' }
export const STATUS_RAB = { draft: ['abu', 'Draft'], diajukan: ['kuning', 'Menunggu ACC'], disetujui: ['hijau', 'Disetujui'], ditolak: ['merah', 'Ditolak'] }
// Tanggal terakhir sebuah bulan, mis. akhirBulan('2026-11') -> '2026-11-30'
export const akhirBulan = (ym) => { const [y, m] = ym.split('-').map(Number); return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}` }
