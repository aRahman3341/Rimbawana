-- ============================================================================
-- RIMBAWANA WEB - 07 AKSES ROLE YANG DIATUR FOUNDER + CS FOUNDER
-- * akses_role      : izin apa saja yang dimiliki tiap peran (diatur Founder di menu Akses & CS Founder)
-- * akses_pengguna  : izin tambahan untuk satu orang tertentu (mis. setelah permintaan disetujui)
-- * akses_permintaan: permintaan akses / bantuan dari pengurus ke "CS Founder"
-- Jalankan SETELAH 01-06. Aman dijalankan berulang (isi awal hanya dimasukkan jika tabel masih kosong,
-- jadi pengaturan yang sudah diubah Founder tidak tertimpa).
-- Sebelum skrip ini dijalankan, aplikasi tetap berjalan memakai pembagian bawaan di lib/auth.js.
-- ============================================================================
create table if not exists public.akses_role (
  role text not null, izin text not null,
  primary key (role, izin));

create table if not exists public.akses_pengguna (
  anggota_id uuid not null references public.anggota(id) on delete cascade,
  izin text not null,
  alasan text,
  diberikan_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (anggota_id, izin));

create table if not exists public.akses_permintaan (
  id uuid primary key default gen_random_uuid(),
  anggota_id uuid not null references public.anggota(id) on delete cascade,
  izin text,                                    -- kosong = bantuan lain (bukan permintaan akses)
  pesan text not null,
  status text not null default 'baru' check (status in ('baru','disetujui','ditolak')),
  balasan text,
  diputuskan_pada timestamptz,
  created_at timestamptz not null default now());
create index if not exists akses_permintaan_status_idx on public.akses_permintaan(status, created_at desc);

-- Isi awal = pembagian wewenang bawaan (Founder selalu punya semua izin dan tidak disimpan di sini)
insert into public.akses_role (role, izin)
select v.role, v.izin from (values
  ('ketua_adat','pengurus'),('sekretaris','pengurus'),('bendahara','pengurus'),('perlengkapan','pengurus'),
  ('ketua_adat','lihat'),('sekretaris','lihat'),('bendahara','lihat'),('perlengkapan','lihat'),('bpr','lihat'),
  ('ketua_adat','inventaris'),('sekretaris','inventaris'),('perlengkapan','inventaris'),
  ('ketua_adat','lihatInv'),('sekretaris','lihatInv'),('perlengkapan','lihatInv'),('bpr','lihatInv'),
  ('ketua_adat','surat'),('sekretaris','surat'),
  ('bendahara','uang'),
  ('ketua_adat','keputusan'),
  ('ketua_adat','profil'),('sekretaris','profil'),
  ('bpr','arahan'),
  ('ketua_adat','chatAdmin'),('sekretaris','chatAdmin')
) as v(role, izin)
where not exists (select 1 from public.akses_role);

alter table public.akses_role enable row level security;
alter table public.akses_pengguna enable row level security;
alter table public.akses_permintaan enable row level security;
notify pgrst, 'reload schema';
