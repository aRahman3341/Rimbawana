-- RIMBAWANA WEB - 03 (OPSIONAL) CEK TABEL LAMA SISA APLIKASI ASET
-- Proyek Supabase "Inventaris-Rimba" dulunya dipakai Aset-V10-New, jadi mungkin masih ada tabel lama.
-- Aplikasi baru TIDAK memakai tabel-tabel itu dan tidak bentrok dengannya.
-- LANGKAH 1: jalankan query di bawah, lihat daftar tabelnya.
select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text as jumlah_baris
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- TABEL YANG DIPAKAI APLIKASI BARU (JANGAN DIHAPUS):
--   anggota, angkatan, lokasi_simpan, mapala_mitra, barang_jenis, barang_unit, pinjam, pinjam_item, pinjam_unit,
--   surat_nomor, surat_arsip, kegiatan_rab, rmb_pengaturan, kas_iuran, buku_kas
--
-- LANGKAH 2 (hanya jika yakin): untuk tabel LAIN yang tidak terpakai, hapus satu per satu. Contoh (hilangkan tanda -- untuk menjalankan):
-- drop table if exists public.nama_tabel_lama cascade;
-- Sarankan ekspor/backup dulu dari Supabase > Database > Backups sebelum menghapus apa pun.
