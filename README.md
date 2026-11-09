# Rimbawana Web v0.4

Situs publik + sistem internal UKM Rimbawana UPI Kampus Cibiru.
Stack: Next.js 14 + Supabase (Postgres, Auth, Storage) + Vercel gratis.

## Baru di v0.4
| Fitur | Keterangan |
|---|---|
| **Pinjam alat lebih sederhana** | Katalog dan formulir digabung jadi satu halaman: daftar ringkas dengan tombol +/-, lalu 5 isian singkat. `/katalog` otomatis mengarah ke `/pinjam` |
| **Ganti logo** | Menu *Profil Situs* > bagian **Logo Rimbawana**. Logo baru langsung dipakai di navigasi, beranda, login, menu admin, dan ikon tab. Ada tombol kembali ke logo bawaan |
| **Data Angkatan per tahun** | Menu *Master > Data Angkatan*: Sekretaris mengisi nama angkatan untuk tiap tahun sejak 2004. **Singkatan opsional.** Ada pengisian satu per satu dan **isi massal** (`tahun | nama | singkatan`), plus papan kelengkapan tahun yang belum diisi |
| **Sejarah per tahun** | Halaman Tentang menggabungkan cerita dan nama angkatan tiap tahun, lengkap dengan navigasi lompat ke tahun |
| **Angkatan di data anggota** | Pilihan angkatan di form anggota kini mengambil dari Data Angkatan. Sekretaris juga boleh menetapkan angkatan anggota (peran pengurus tetap khusus Ketua Adat) |

## Baru di v0.3
| Fitur | Keterangan |
|---|---|
| **Profil Situs** (menu admin) | Identitas, sejarah, divisi, dan alur kaderisasi diubah dari web, langsung tampil di situs publik |
| **Galeri Media** | Foto/video/album Rimbawana dicatat sebagai **link Google Drive** (atau foto kecil), tampil di halaman Galeri publik |
| **Berkas tidak di database** | Surat dan RAB disimpan sebagai file (Supabase Storage, maks 50 MB) atau link Drive (maks 100 MB). Database hanya menyimpan penunjuk dan memastikan file itu ada |
| **Chat Pengurus** | Ruang chat grup ala WhatsApp untuk pengurus dan BPR, diatur admin. Pesan masuk otomatis. Bisa membagikan **kartu Google Meet** |
| **Role BPR** | Badan Pengawas Rimbawana: melihat semua halaman pengurus, **tidak bisa mengubah apa pun**, bisa memberi **arahan** di menu Pengawasan BPR |
| **Barang hilang otomatis** | Barang yang semua stoknya sudah dipesan/dipinjam otomatis hilang dari katalog dan form pinjam publik. Ada juga tombol **Sembunyikan** per barang |
| **Founder tersembunyi** | Role Founder hanya untuk akun developer, tidak muncul di daftar anggota, kas, chat, atau laporan siapa pun. Becel kini Bendahara biasa |

## Wewenang per peran
| Peran | Boleh |
|---|---|
| Ketua Adat | Barang, peminjaman, surat, ubah profil situs, buat ruang chat, **ACC/tolak RAB** |
| Sekretaris | Barang, peminjaman, surat, ubah profil situs, kelola anggota, buat ruang chat |
| Perlengkapan | Barang, peminjaman, lokasi, mapala mitra |
| Bendahara | Verifikasi kas, catat transaksi, pengaturan kas/QRIS |
| **BPR** | **Hanya melihat** (barang, peminjaman, surat, kas, buku kas, RAB, chat) + memberi arahan |
| Anggota | Lihat barang, bayar kas sendiri |

Pembagian ini bisa diubah di satu tempat: `lib/auth.js` (objek `KELOMPOK`).

---
## A. Upgrade dari versi sebelumnya (sudah terpasang)
1. Ekstrak ZIP, timpa isi folder repo (jangan hapus folder `.git`), commit dan push lewat GitHub Desktop.
2. Supabase > SQL Editor, jalankan yang belum pernah dijalankan (semuanya aman diulang):
   * **`04_fitur_lanjutan.sql`** (dari v0.3): peran BPR, tabel baru, Becel menjadi Bendahara, batas ukuran Storage.
   * **`06_angkatan_sejarah.sql`** (baru di v0.4): kolom tahun pada angkatan, singkatan jadi opsional. Data angkatan yang ada (mis. SPG) tidak berubah.
3. (Opsional) buat akun Founder developer: ikuti **`supabase/05_founder_tersembunyi.sql`**.
4. (Opsional, disarankan) pasang Kunci Google (bagian C).
5. Restart `npm run dev`, atau tunggu Vercel selesai deploy.
6. Untuk menjadikan seseorang BPR: menu **Anggota > ubah**, jabatan **pengurus**, peran **Badan Pengawas (BPR)**.

## B. Pasang dari nol
1. Node.js 20 LTS. Perintah `git` tidak wajib (pakai GitHub Desktop).
2. Supabase SQL Editor, jalankan berurutan: `01_rombak_inventaris.sql`, `02_seed_inventaris.sql`, `04_fitur_lanjutan.sql`, `06_angkatan_sejarah.sql` (lalu opsional `03` dan `05`).
3. Salin `.env.example` menjadi `.env.local`, isi kunci Supabase (Project Settings > API). **Jangan commit `.env.local`.**
4. `npm install` lalu `npm run dev`, buka http://localhost:3000.
5. Deploy: Vercel > Import repo > isi Environment Variables yang sama (`NEXT_PUBLIC_SITE_URL` = alamat Vercel-mu).

## C. Kunci Google (agar sistem memastikan file Drive ADA dan ukurannya <= 100 MB)
Tanpa kunci, link Drive tetap diterima (halaman publiknya dicek terbuka), tetapi **ukuran tidak bisa diperiksa**.
1. console.cloud.google.com > buat proyek baru.
2. APIs & Services > Library > cari **Google Drive API** > Enable.
3. APIs & Services > Credentials > Create credentials > **API key**. Batasi ke Google Drive API.
4. Salin ke `GOOGLE_API_KEY` di `.env.local` dan di Environment Variables Vercel. Kunci ini hanya bisa membaca info file yang dibagikan publik.

## D. Cara memakai
* **File surat/RAB/foto:** pilih tab *Unggah file* (maks 50 MB) atau *Link Google Drive* (maks 100 MB). Di Drive: Bagikan > Akses umum > **Siapa saja yang memiliki link** (Pelihat), lalu salin link. File di atas 50 MB otomatis diarahkan ke Drive.
* **Data Angkatan:** menu *Master > Data Angkatan*. Klik sebuah tahun di papan atas untuk mengisinya. Satu angkatan = tahun + nama (+ singkatan jika ada). Banyak sekaligus: tempel satu baris satu angkatan, mis. `2005 | Nama Angkatan | SNG` (singkatan boleh dikosongkan). Angkatan yang masih dipakai anggota tidak bisa dihapus. Cerita sejarah tiap tahun ditulis di *Profil Situs*; keduanya otomatis bertemu di halaman Tentang.
* **Ganti logo:** *Profil Situs* > Logo Rimbawana > pilih gambar (PNG transparan disarankan, maks 10 MB) > Ganti Logo.
* **Galeri:** menu *Galeri Media* > Tambah Media. Video, album (link folder), dan foto besar lewat Drive. Tombol mata menyembunyikan dari situs publik.
* **Profil Situs:** ubah teks, tambah bagian sejarah, divisi, tahap kaderisasi. Tersimpan di database, tampil di Beranda/Tentang.
* **Chat:** menu *Chat Pengurus*. Ketua Adat/Sekretaris membuat ruang (umum = semua pengurus + BPR, khusus = anggota dipilih) dan mengatur anggota lewat *Atur ruang*. Ikon kamera di kolom pesan membagikan link **Google Meet** (tombol *Buat rapat Meet baru* membuka meet.new). Rapat yang akan datang tampil di Dashboard.
* **Pengawasan BPR:** BPR menulis arahan (bisa dikaitkan ke kegiatan); pengurus menanggapi dan menandai Dikerjakan/Selesai.
* **Sembunyikan barang:** otomatis saat stok bebas = 0 (tersedia dikurangi yang sudah dipesan). Manual: Data Barang > Kelola > centang *Sembunyikan*.

## E. Masalah umum
| Gejala | Solusi |
|---|---|
| "Invalid Server Actions request" saat dibuka lewat tunnel/HP | Sudah ditangani untuk `*.devtunnels.ms` di `next.config.js`. Tambahkan domain tunnel lain di `allowedOrigins` |
| Link Drive ditolak "belum dibagikan" | Ubah akses umum ke "Siapa saja yang memiliki link" |
| Ukuran Drive tidak diperiksa | Pasang `GOOGLE_API_KEY` (bagian C) |
| Tidak bisa memberi peran BPR | Pastikan `04_fitur_lanjutan.sql` sudah dijalankan. Jika masih gagal, kirim hasil `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.anggota'::regclass;` |
| Tabel baru "tidak ditemukan" | Tunggu semenit atau jalankan `notify pgrst, 'reload schema';` |

## Struktur folder
```
app/            halaman (publik di app/(publik); internal di app/<modul>)
components/     Shell, FormAksi, UnggahBerkas, ChatRoom, ...
lib/            auth.js (peran), drive.js, berkas.js, chat.js, profil.js, konten.js (isi cadangan)
supabase/       skrip SQL 01-06
```
