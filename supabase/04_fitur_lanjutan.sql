-- ============================================================================
-- RIMBAWANA WEB - 04 FITUR LANJUTAN
-- Peran BPR, Founder tersembunyi, sembunyikan barang, berkas Drive, profil situs
-- yang bisa diedit, galeri media, arahan BPR, dan chat pengurus.
-- Jalankan SETELAH 01 dan 02. Aman dijalankan berulang.
-- ============================================================================

-- ---------- 1. Peran baru: BPR (Badan Pengawas Rimbawana) -------------------
-- Kolom anggota.peran bisa bertipe enum ATAU teks + CHECK; skrip ini menangani keduanya.
do $$
declare v_tipe text; v_udt text; c record;
begin
  select data_type, udt_name into v_tipe, v_udt from information_schema.columns
   where table_schema = 'public' and table_name = 'anggota' and column_name = 'peran';
  if v_tipe is null then raise exception 'Kolom anggota.peran tidak ditemukan.'; end if;
  if v_tipe = 'USER-DEFINED' then
    execute format('alter type public.%I add value if not exists %L', v_udt, 'bpr');
  else
    for c in select conname from pg_constraint
             where conrelid = 'public.anggota'::regclass and contype = 'c'
               and pg_get_constraintdef(oid) ilike '%peran%' and pg_get_constraintdef(oid) not ilike '%jabatan%' loop
      execute format('alter table public.anggota drop constraint %I', c.conname);
    end loop;
    alter table public.anggota add constraint anggota_peran_cek
      check (peran in ('founder','ketua_adat','sekretaris','bendahara','perlengkapan','bpr','anggota'));
  end if;
end $$;

-- Becel selama ini tercatat Founder padahal pemegang kas: jadikan Bendahara biasa.
-- Founder sekarang hanya akun developer terpisah yang tersembunyi (lihat 05_founder_tersembunyi.sql).
update public.anggota set peran = 'bendahara' where peran::text = 'founder' and nama_adat = 'Becel';

-- ---------- 2. Sembunyikan barang + stok yang sudah dipesan ------------------
alter table public.barang_jenis add column if not exists sembunyikan boolean not null default false;

create or replace view public.v_stok_jenis as
select j.id, j.divisi, j.nama, j.satuan, j.keterangan, j.foto_path, j.urut,
  count(u.id) filter (where u.status <> 'nonaktif')                               as total,
  count(u.id) filter (where u.status <> 'nonaktif' and u.kondisi = 'layak')       as layak,
  count(u.id) filter (where u.status <> 'nonaktif' and u.kondisi = 'tidak_layak') as tidak_layak,
  count(u.id) filter (where u.status = 'tersedia' and u.kondisi = 'layak')        as tersedia,
  count(u.id) filter (where u.status = 'dipinjam')                                as dipinjam,
  coalesce(sum(u.harga) filter (where u.status <> 'nonaktif'), 0)                 as nilai,
  -- dipesan = jumlah yang sudah diminta (status menunggu) tapi belum diserahkan
  coalesce((select sum(i.jumlah) from public.pinjam_item i join public.pinjam p on p.id = i.pinjam_id
            where i.jenis_id = j.id and p.status = 'menunggu'), 0)                as dipesan,
  -- bebas = tersedia dikurangi yang sudah dipesan. Barang dengan bebas = 0 otomatis hilang dari daftar publik.
  greatest(count(u.id) filter (where u.status = 'tersedia' and u.kondisi = 'layak')
    - coalesce((select sum(i.jumlah) from public.pinjam_item i join public.pinjam p on p.id = i.pinjam_id
                where i.jenis_id = j.id and p.status = 'menunggu'), 0), 0)        as bebas,
  j.sembunyikan
from public.barang_jenis j
left join public.barang_unit u on u.jenis_id = j.id
group by j.id;

-- Tunggakan kas: akun Founder (developer) tidak ikut dihitung
create or replace view public.v_tunggakan as
with cfg as (
  select coalesce((select nilai::date from public.rmb_pengaturan where kunci = 'kas_mulai'), date_trunc('month', current_date)::date) as mulai,
         coalesce((select nilai::numeric from public.rmb_pengaturan where kunci = 'kas_nominal'), 25000) as nominal
), bulan as (
  select generate_series(cfg.mulai, date_trunc('month', current_date)::date, interval '1 month')::date as periode from cfg
)
select a.id as anggota_id, a.nama_adat, a.nama_lengkap, b.periode, cfg.nominal
from public.anggota a cross join cfg cross join bulan b
where a.aktif and a.jabatan::text <> 'alumni' and a.peran::text <> 'founder'
  and not exists (select 1 from public.kas_iuran k where k.anggota_id = a.id and k.periode = b.periode and k.status in ('menunggu','terverifikasi'));

-- ---------- 3. Berkas: file TIDAK disimpan di database -----------------------
-- Database hanya menyimpan penunjuk: path di Supabase Storage ATAU link Google Drive,
-- ditambah nama dan ukuran untuk memastikan file benar-benar ada (maks 100 MB).
alter table public.surat_arsip  add column if not exists file_url text, add column if not exists file_nama text, add column if not exists file_ukuran bigint;
alter table public.kegiatan_rab add column if not exists rab_url  text, add column if not exists rab_nama  text, add column if not exists rab_ukuran  bigint;

-- ---------- 4. Profil situs yang bisa diedit dari admin ----------------------
create table if not exists public.profil_konten (
  kunci text primary key, nilai jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists public.profil_sejarah (
  id uuid primary key default gen_random_uuid(), urut int not null default 0, tahun text, judul text, isi text not null,
  created_at timestamptz not null default now());
create table if not exists public.profil_divisi (
  id uuid primary key default gen_random_uuid(), urut int not null default 0, kode text, ikon text not null default 'compass',
  nama text not null, isi text);
create table if not exists public.profil_kaderisasi (
  id uuid primary key default gen_random_uuid(), urut int not null default 0, tahap text not null, isi text,
  sub text[] not null default '{}');

insert into public.profil_konten (kunci, nilai) values ('identitas', jsonb_build_object(
  'nama','Rimbawana','lengkap','Unit Kegiatan Mahasiswa Rimbawana','kampus','Universitas Pendidikan Indonesia - Kampus di Cibiru',
  'alamat','Sekretariat: Gd. PKM, Jl. Raya Cibiru Km. 15, Bandung 40393','email','rimbawana04@upi.edu',
  'tagline','Berorientasi pada pendidikan dan lingkungan','sosial','[]'::jsonb)) on conflict (kunci) do nothing;
insert into public.profil_divisi (urut, kode, ikon, nama, isi)
select * from (values
  (1,'PLH','tree','Pendidikan Lingkungan Hidup','Menumbuhkan kepedulian terhadap lingkungan lewat pendidikan, kegiatan lapangan, dan aksi nyata bersama masyarakat.'),
  (2,'RC','triangle','Panjat Tebing','Latihan teknik pemanjatan: SOP dan edukasi, tali temali, top rope, lead climbing, SRT, rappeling, hingga vertical rescue.'),
  (3,'HG','compass','Hutan Gunung','Keterampilan berkegiatan di hutan dan gunung: navigasi, manajemen perjalanan, mendirikan camp, serta komunikasi lapangan.')
) v(urut,kode,ikon,nama,isi) where not exists (select 1 from public.profil_divisi);
insert into public.profil_kaderisasi (urut, tahap, isi, sub)
select * from (values
  (1,'Pra-Diklat','Pengenalan awal calon anggota.', '{}'::text[]),
  (2,'Diklatsar','Pendidikan dan latihan dasar.', '{}'::text[]),
  (3,'Pendidikan Lanjutan','Pendalaman ilmu divisi, terdiri dari tiga tahap:', array['Masa Bimbingan (Mabim)','Pengabdian','Pengembaraan'])
) v(urut,tahap,isi,sub) where not exists (select 1 from public.profil_kaderisasi);

-- ---------- 5. Galeri media (foto/video Rimbawana: link Drive atau foto kecil) ----
create table if not exists public.media_rimbawana (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in ('foto','video','album','dokumen')),
  judul text not null, deskripsi text, tanggal date,
  drive_url text, drive_id text, drive_nama text, drive_ukuran bigint,
  foto_path text,
  tampil boolean not null default true,
  dibuat_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now(),
  check (drive_url is not null or foto_path is not null));
create index if not exists media_rimbawana_tanggal_idx on public.media_rimbawana(tanggal desc, created_at desc);

-- ---------- 6. Arahan BPR ---------------------------------------------------
create table if not exists public.arahan_bpr (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid references public.kegiatan_rab(id) on delete set null,
  judul text not null, isi text not null,
  status text not null default 'baru' check (status in ('baru','dikerjakan','selesai')),
  tanggapan text,
  dibuat_oleh uuid references public.anggota(id) on delete set null,
  ditanggapi_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
drop trigger if exists arahan_bpr_upd on public.arahan_bpr;
create trigger arahan_bpr_upd before update on public.arahan_bpr for each row execute function public.rmb_set_updated();

-- ---------- 7. Chat pengurus ------------------------------------------------
create table if not exists public.chat_ruang (
  id uuid primary key default gen_random_uuid(),
  nama text not null, deskripsi text,
  tipe text not null default 'khusus' check (tipe in ('umum','khusus')),   -- umum = semua pengurus + BPR
  arsip boolean not null default false,
  dibuat_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now());
create table if not exists public.chat_anggota (
  ruang_id uuid not null references public.chat_ruang(id) on delete cascade,
  anggota_id uuid not null references public.anggota(id) on delete cascade,
  admin boolean not null default false,
  primary key (ruang_id, anggota_id));
create table if not exists public.chat_pesan (
  id bigint generated always as identity primary key,
  ruang_id uuid not null references public.chat_ruang(id) on delete cascade,
  pengirim_id uuid references public.anggota(id) on delete set null,
  jenis text not null default 'teks' check (jenis in ('teks','meet','sistem')),
  isi text, meet_url text, meet_judul text, meet_waktu timestamptz,
  dihapus boolean not null default false,
  created_at timestamptz not null default now());
create index if not exists chat_pesan_ruang_idx on public.chat_pesan(ruang_id, id desc);
create table if not exists public.chat_baca (
  ruang_id uuid not null references public.chat_ruang(id) on delete cascade,
  anggota_id uuid not null references public.anggota(id) on delete cascade,
  terakhir_id bigint not null default 0,
  primary key (ruang_id, anggota_id));
insert into public.chat_ruang (nama, deskripsi, tipe)
select 'Pengurus Rimbawana', 'Ruang bersama seluruh pengurus dan BPR', 'umum' where not exists (select 1 from public.chat_ruang);

-- ---------- 8. Keamanan & penyimpanan ---------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profil_konten','profil_sejarah','profil_divisi','profil_kaderisasi','media_rimbawana','arahan_bpr',
                           'chat_ruang','chat_anggota','chat_pesan','chat_baca'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- File di Supabase Storage maksimal 50 MB (batas paket gratis). File 50-100 MB dipasang lewat link Google Drive.
update storage.buckets set file_size_limit = 52428800 where id = 'arsip';
update storage.buckets set file_size_limit = 10485760 where id = 'foto';

notify pgrst, 'reload schema';
