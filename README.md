# Rimbawana Web v0.2

Situs publik + sistem internal UKM Rimbawana UPI Kampus Cibiru: **inventaris barang, peminjaman, arsip surat, kas anggota (QRIS), buku kas, dan RAB kegiatan**.
Stack: Next.js 14 (App Router) + Supabase (Postgres, Auth, Storage) + Vercel gratis.

## Isi versi ini
| Area | Fitur |
|---|---|
| Situs publik | Beranda, Tentang (sejarah), Katalog Alat, Pinjam Alat (tanpa login), halaman info barang dari QR |
| Inventaris | Jenis dan unit barang, harga, kondisi layak/tidak layak, foto, lokasi simpan, QR label, impor dan ekspor Excel |
| Peminjaman | Anggota (dari situs publik), mapala lain pinjam ke kita, kita pinjam ke mapala lain (jadi inventaris sementara). Status unit berubah otomatis |
| Arsip surat | Nomor surat otomatis, unggah PDF, surat masuk/keluar, kaitan ke kegiatan dan peminjaman |
| Keuangan | Kas Rp 25.000/bulan, bayar QRIS + bukti, verifikasi bendahara, daftar penunggak, buku kas, RAB PDF yang di-ACC Ketua Adat |
| Akun | Login nama adat, ganti password pertama, kelola anggota (fase 1, tetap) |

## Wewenang per peran
| Peran | Boleh |
|---|---|
| Founder | Semua |
| Ketua Adat | Barang, peminjaman, surat, **ACC/tolak RAB**, lihat keuangan |
| Sekretaris | Barang, peminjaman, surat, kelola anggota |
| Perlengkapan | Barang, peminjaman, lokasi, mapala mitra |
| Bendahara | Verifikasi kas, catat transaksi, pengaturan kas/QRIS |
| Anggota | Lihat barang, bayar kas sendiri |

Mau ubah pembagian? Edit satu tempat saja: `lib/auth.js` (objek `KELOMPOK`).

---
## A. Pasang (pertama kali)

### 1. Siapkan alat
* **Node.js 20 LTS** dari nodejs.org (cek: `node -v`). Perintah `git` tidak wajib: pakai **GitHub Desktop** untuk commit dan push.

### 2. Timpa isi repo
1. Ekstrak ZIP ini.
2. Buka folder repo `rimbawana-web` di komputer (yang dikelola GitHub Desktop).
3. Hapus semua isinya **kecuali folder `.git`** (folder tersembunyi), lalu salin seluruh isi hasil ekstrak ZIP ke dalamnya.
4. Di GitHub Desktop: tulis pesan commit (mis. "v0.2: inventaris, surat, keuangan") lalu **Commit** dan **Push origin**.

### 3. Database Supabase (proyek lama Inventaris-Rimba)
Buka Supabase, menu **SQL Editor**, lalu jalankan berurutan (tempel isi file, klik Run):
1. `supabase/01_rombak_inventaris.sql`: membuat semua tabel baru, fungsi, dan bucket penyimpanan. Aman diulang. Tidak menyentuh tabel `anggota` dan `angkatan`.
2. `supabase/02_seed_inventaris.sql`: memasukkan 50 jenis / 255 unit dari Excel `Inventaris_Rimbawana_2026.xlsx` (RC dan HG). Aman diulang.
3. (Opsional) `supabase/03_opsional_cek_tabel_lama.sql`: menampilkan daftar tabel. Tabel sisa aplikasi Aset yang tidak terpakai bisa dihapus manual setelah backup.

Cek hasilnya: menu **Table Editor** harus menampilkan tabel `barang_jenis`, `barang_unit`, `pinjam`, `surat_arsip`, `kas_iuran`, `buku_kas`, dan seterusnya. Menu **Storage** harus punya bucket `arsip` (privat) dan `foto` (publik).
Jika aplikasi bilang tabel tidak ditemukan, tunggu semenit atau jalankan `notify pgrst, 'reload schema';`.

### 4. Variabel lingkungan
Salin `.env.example` menjadi **`.env.local`** (di folder proyek) lalu isi:
```
NEXT_PUBLIC_SUPABASE_URL=...           (Supabase > Project Settings > API > Project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      (anon public key)
SUPABASE_SERVICE_ROLE_KEY=...          (service_role key, RAHASIA)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EMAIL_DOMAIN_TEKNIS=anggota.invalid    (biarkan sama seperti yang sudah dipakai sebelumnya)
```
Nilai ini sama dengan yang sudah kamu pakai di fase 1. **Jangan pernah meng-commit `.env.local`** (sudah ada di `.gitignore`).

### 5. Jalankan di komputer
```
npm install
npm run dev
```
Buka http://localhost:3000. Login dengan akun yang sudah ada.

### 6. Deploy ke Vercel (gratis)
1. vercel.com > Add New > Project > pilih repo `rimbawana-web`.
2. Isi **Environment Variables** yang sama seperti di `.env.local`, tetapi `NEXT_PUBLIC_SITE_URL` diisi alamat Vercel-mu (mis. `https://rimbawana.vercel.app`).
3. Deploy. Setiap push ke GitHub otomatis memperbarui situs.

---
## B. Setelah terpasang: yang perlu kamu isi

1. **Sejarah Rimbawana** (halaman Tentang): buka `lib/konten.js`, isi daftar `SEJARAH`. Contoh format ada di komentar file itu. Alamat, email, dan akun sosial media juga di file yang sama.
2. **QRIS**: login sebagai Bendahara/Founder, menu **Kas Anggota**, bagian Pengaturan kas, unggah gambar QRIS. Cek juga nominal (default Rp 25.000) dan **bulan mulai tagihan** (default November 2026).
3. **Mapala mitra dan lokasi simpan**: menu Master.
4. **Harga dan kondisi barang**: menu Data Barang, klik Kelola pada barang lalu Ubah per unit. Atau isi kolom Harga di Excel lalu impor.
5. **Label QR**: Data Barang, tombol Cetak QR. QR membuka halaman info barang di situs.
6. **Format nomor surat**: default `007/RMB-UPI/UND/XI/2026`. Jika format resmi berbeda, ubah di fungsi `rmb_buat_surat_keluar` pada `01_rombak_inventaris.sql` (ada komentar "FORMAT NOMOR SURAT") lalu jalankan ulang file itu.

## C. Alur kerja singkat
* **Pinjam alat (anggota)**: situs publik > Pinjam Alat > isi formulir. Pengurus perlengkapan membuka **Peminjaman**, tekan **Setujui & Serahkan**, unit dipilih otomatis. Saat kembali, tandai tiap unit layak atau tidak layak.
* **Mapala lain pinjam / kita pinjam**: **Peminjaman > Catat Peminjaman**. Alat pinjaman dari mapala lain muncul sebagai unit sementara (berlabel "pinjaman") sampai dikembalikan.
* **Kas**: anggota bayar lewat QRIS, unggah bukti. Bendahara menerima atau menolak. Yang diterima otomatis masuk **Buku Kas**. Kas tunai dicatat bendahara.
* **RAB**: pengurus buat kegiatan dan unggah RAB (PDF), Ketua Adat ACC atau tolak (dengan alasan). Pengeluaran kegiatan baru bisa dicatat setelah RAB disetujui. Progres terpakai vs anggaran tampil otomatis.

## D. Masalah umum
| Gejala | Solusi |
|---|---|
| `Invalid API key` / halaman error | Periksa `.env.local`, lalu restart `npm run dev` |
| Tidak bisa unggah PDF/foto | Pastikan `01_rombak_inventaris.sql` sudah dijalankan (bucket dan policy storage) dan kamu sudah login |
| Anggota tidak bisa kirim bukti kas | Berkas maksimal 10 MB, format PDF/PNG/JPG/WEBP |
| Impor Excel "0 baris" | Pakai template (Impor Excel > Unduh Template). Kolom wajib: Divisi, Nama Barang, Jumlah |
| Perintah `git` tidak dikenal | Tidak masalah, pakai GitHub Desktop |

## Struktur folder
```
app/            halaman (publik di app/(publik), internal di app/<modul>)
components/     komponen bersama (Shell, FormAksi, UnggahBerkas, ...)
lib/            auth.js (peran), konten.js (isi situs), format.js, db.js, ...
supabase/       skrip SQL 01-03
public/         logo.png, topo.svg (pola peta kontur)
```
