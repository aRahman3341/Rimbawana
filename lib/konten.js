// ISI HALAMAN PUBLIK. Ubah teks di sini tanpa perlu menyentuh kode halaman.

export const IDENTITAS = {
  nama: 'Rimbawana',
  lengkap: 'Unit Kegiatan Mahasiswa Rimbawana',
  kampus: 'Universitas Pendidikan Indonesia - Kampus di Cibiru',
  alamat: 'Sekretariat: Gd. PKM, Jl. Raya Cibiru Km. 15, Bandung 40393',
  email: 'rimbawana04@upi.edu',
  tagline: 'Berorientasi pada pendidikan dan lingkungan',
  // Tambahkan akun media sosial di sini, contoh: { nama: 'Instagram', ikon: 'instagram', url: 'https://instagram.com/...' }
  sosial: [],
}

// SEJARAH TERBENTUKNYA RIMBAWANA.
// Isi daftar di bawah, satu item = satu bagian cerita (urut dari yang paling awal).
// Selama daftar ini kosong, halaman Tentang menampilkan pesan "akan segera dilengkapi".
// Contoh item:  { tahun: '19xx', judul: 'Awal berdiri', isi: 'Ceritakan di sini...' },
export const SEJARAH = []

export const DIVISI_PUBLIK = [
  { kode: 'PLH', ikon: 'tree', nama: 'Pendidikan Lingkungan Hidup',
    isi: 'Menumbuhkan kepedulian terhadap lingkungan lewat pendidikan, kegiatan lapangan, dan aksi nyata bersama masyarakat.' },
  { kode: 'RC', ikon: 'triangle', nama: 'Panjat Tebing',
    isi: 'Latihan teknik pemanjatan: SOP dan edukasi, tali temali, top rope, lead climbing, SRT, rappeling, hingga vertical rescue.' },
  { kode: 'HG', ikon: 'compass', nama: 'Hutan Gunung',
    isi: 'Keterampilan berkegiatan di hutan dan gunung: navigasi, manajemen perjalanan, mendirikan camp, serta komunikasi lapangan.' },
]

// Jalur pengkaderan (sesuai alur kaderisasi Rimbawana).
export const KADERISASI = [
  { tahap: 'Pra-Diklat', isi: 'Pengenalan awal calon anggota.' },
  { tahap: 'Diklatsar', isi: 'Pendidikan dan latihan dasar.' },
  { tahap: 'Pendidikan Lanjutan', isi: 'Pendalaman ilmu divisi, terdiri dari tiga tahap:',
    sub: ['Masa Bimbingan (Mabim)', 'Pengabdian', 'Pengembaraan'] },
]
