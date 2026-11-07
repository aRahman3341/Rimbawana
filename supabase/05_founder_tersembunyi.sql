-- RIMBAWANA WEB - 05 AKUN FOUNDER TERSEMBUNYI (opsional, untuk developer)
-- Founder = akun developer terpisah. Tidak muncul di daftar anggota, kas, chat, maupun laporan siapa pun.
-- LANGKAH 1: Supabase > Authentication > Users > Add user: buat email + password untuk developer.
-- LANGKAH 2: ganti 'dev@contoh.com' di bawah dengan email itu, lalu jalankan.
-- Login memakai nama adat 'dev' (ubah bila perlu) dan password tadi.
insert into public.anggota (nama_lengkap, nama_adat, peran, jabatan, status, aktif, wajib_ganti_password, user_id, email_login)
select 'Developer', 'dev', 'founder', 'pengurus', 'AP', true, false, u.id, u.email
from auth.users u where u.email = 'dev@contoh.com'
on conflict do nothing;
-- Catatan: jika muncul error NTA wajib untuk pengurus, tambahkan kolom nta berisi teks bebas pada insert di atas.
