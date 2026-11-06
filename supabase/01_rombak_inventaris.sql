-- ============================================================================
-- RIMBAWANA WEB - 01 ROMBAK INVENTARIS, SURAT, KEUANGAN
-- Jalankan SEKALI di Supabase > SQL Editor (aman dijalankan ulang).
-- Tidak mengubah tabel `anggota` dan `angkatan` yang sudah ada.
-- Semua tabel baru memakai nama berbeda dari tabel lama Aset-V10-New
-- (peminjaman, location, category, dst) supaya tidak bentrok.
-- ============================================================================

-- ---------- 0. Fungsi bantu -------------------------------------------------
create or replace function public.rmb_peran() returns text
language sql stable security definer set search_path = public as $$
  select a.peran::text from public.anggota a where a.user_id = auth.uid() and a.aktif limit 1
$$;

create or replace function public.rmb_is_pengurus() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.rmb_peran() in ('founder','ketua_adat','sekretaris','bendahara','perlengkapan'), false)
$$;

create or replace function public.rmb_set_updated() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- 1. Master ------------------------------------------------------
create table if not exists public.lokasi_simpan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  keterangan text,
  created_at timestamptz not null default now()
);

create table if not exists public.mapala_mitra (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  kampus text,
  kontak_nama text,
  kontak_hp text,
  alamat text,
  catatan text,
  created_at timestamptz not null default now()
);

-- ---------- 2. Inventaris --------------------------------------------------
create table if not exists public.barang_jenis (
  id uuid primary key default gen_random_uuid(),
  divisi text not null check (divisi in ('RC','HG','PLH','UMUM')),
  nama text not null,
  satuan text not null default 'buah',
  keterangan text,
  foto_path text,
  urut int not null default 0,
  created_at timestamptz not null default now(),
  unique (divisi, nama)
);

create table if not exists public.barang_unit (
  id uuid primary key default gen_random_uuid(),
  jenis_id uuid not null references public.barang_jenis(id) on delete cascade,
  nomor text not null unique,
  lokasi_id uuid references public.lokasi_simpan(id) on delete set null,
  kondisi text not null default 'layak' check (kondisi in ('layak','tidak_layak')),
  status text not null default 'tersedia' check (status in ('tersedia','dipinjam','nonaktif')),
  harga numeric(14,0) check (harga is null or harga >= 0),
  tahun_beli int,
  keterangan text,
  pemilik_mapala_id uuid references public.mapala_mitra(id) on delete set null,  -- terisi = alat pinjaman sementara
  batas_kembali date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists barang_unit_jenis_idx on public.barang_unit(jenis_id);
create index if not exists barang_unit_status_idx on public.barang_unit(status);
drop trigger if exists barang_unit_upd on public.barang_unit;
create trigger barang_unit_upd before update on public.barang_unit for each row execute function public.rmb_set_updated();

-- ---------- 3. Persuratan --------------------------------------------------
create table if not exists public.kegiatan_rab (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  deskripsi text,
  tempat text,
  tgl_mulai date,
  tgl_selesai date,
  total_rab numeric(14,0) not null default 0 check (total_rab >= 0),
  rab_path text,
  status_rab text not null default 'draft' check (status_rab in ('draft','diajukan','disetujui','ditolak')),
  catatan_keputusan text,
  diputuskan_oleh uuid references public.anggota(id) on delete set null,
  tgl_keputusan timestamptz,
  dibuat_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists kegiatan_rab_upd on public.kegiatan_rab;
create trigger kegiatan_rab_upd before update on public.kegiatan_rab for each row execute function public.rmb_set_updated();

-- ---------- 4. Peminjaman --------------------------------------------------
create sequence if not exists public.rmb_seq_pinjam;
grant usage, select on sequence public.rmb_seq_pinjam to service_role;

create table if not exists public.pinjam (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique default ('PJM-' || to_char(now(),'YYMM') || '-' || lpad(nextval('public.rmb_seq_pinjam')::text, 4, '0')),
  tipe text not null check (tipe in ('anggota','mapala_pinjam','kita_pinjam')),
  peminjam_nama text,
  peminjam_adat text,
  peminjam_hp text,
  mapala_id uuid references public.mapala_mitra(id) on delete set null,
  keperluan text,
  tgl_pinjam date not null default current_date,
  tgl_rencana_kembali date not null,
  tgl_kembali date,
  status text not null default 'menunggu' check (status in ('menunggu','dipinjam','dikembalikan','ditolak')),
  catatan text,
  diproses_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pinjam_status_idx on public.pinjam(status);
drop trigger if exists pinjam_upd on public.pinjam;
create trigger pinjam_upd before update on public.pinjam for each row execute function public.rmb_set_updated();

create table if not exists public.pinjam_item (
  id uuid primary key default gen_random_uuid(),
  pinjam_id uuid not null references public.pinjam(id) on delete cascade,
  jenis_id uuid not null references public.barang_jenis(id) on delete restrict,
  jumlah int not null check (jumlah > 0)
);
create index if not exists pinjam_item_pinjam_idx on public.pinjam_item(pinjam_id);

create table if not exists public.pinjam_unit (
  pinjam_id uuid not null references public.pinjam(id) on delete cascade,
  unit_id uuid not null references public.barang_unit(id) on delete restrict,
  kondisi_kembali text,
  primary key (pinjam_id, unit_id)
);

create table if not exists public.surat_nomor (
  tahun int not null,
  kode text not null,
  terakhir int not null default 0,
  primary key (tahun, kode)
);

create table if not exists public.surat_arsip (
  id uuid primary key default gen_random_uuid(),
  arah text not null check (arah in ('keluar','masuk')),
  kategori text not null check (kategori in ('undangan','peminjaman','proposal','lpj','pemberitahuan','permohonan','lainnya')),
  nomor text not null,
  urut int,
  tanggal date not null,
  perihal text not null,
  pihak text,
  ringkasan text,
  file_path text,
  kegiatan_id uuid references public.kegiatan_rab(id) on delete set null,
  pinjam_id uuid references public.pinjam(id) on delete set null,
  dibuat_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (arah, nomor)
);
create index if not exists surat_arsip_tanggal_idx on public.surat_arsip(tanggal desc);

-- ---------- 5. Keuangan ----------------------------------------------------
create table if not exists public.rmb_pengaturan (
  kunci text primary key,
  nilai text
);
insert into public.rmb_pengaturan(kunci, nilai) values
  ('kas_nominal','25000'), ('kas_mulai','2026-11-01'), ('qris_path','')
on conflict (kunci) do nothing;

create table if not exists public.kas_iuran (
  id uuid primary key default gen_random_uuid(),
  anggota_id uuid not null references public.anggota(id) on delete cascade,
  periode date not null,
  jumlah numeric(14,0) not null check (jumlah > 0),
  metode text not null check (metode in ('qris','tunai')),
  bukti_path text,
  status text not null default 'menunggu' check (status in ('menunggu','terverifikasi','ditolak')),
  catatan text,
  diverifikasi_oleh uuid references public.anggota(id) on delete set null,
  tgl_verifikasi timestamptz,
  created_at timestamptz not null default now(),
  check (periode = date_trunc('month', periode)::date)
);
create unique index if not exists kas_iuran_unik on public.kas_iuran(anggota_id, periode) where status in ('menunggu','terverifikasi');

create table if not exists public.buku_kas (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  tipe text not null check (tipe in ('masuk','keluar')),
  kategori text not null check (kategori in ('kas','iuk','kegiatan','operasional','lainnya')),
  jumlah numeric(14,0) not null check (jumlah > 0),
  keterangan text,
  kegiatan_id uuid references public.kegiatan_rab(id) on delete set null,
  kas_iuran_id uuid unique references public.kas_iuran(id) on delete set null,
  bukti_path text,
  dibuat_oleh uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists buku_kas_tanggal_idx on public.buku_kas(tanggal desc);

-- ---------- 6. Tampilan (view) ---------------------------------------------
create or replace view public.v_stok_jenis as
select j.id, j.divisi, j.nama, j.satuan, j.keterangan, j.foto_path, j.urut,
  count(u.id) filter (where u.status <> 'nonaktif')                          as total,
  count(u.id) filter (where u.status <> 'nonaktif' and u.kondisi = 'layak')       as layak,
  count(u.id) filter (where u.status <> 'nonaktif' and u.kondisi = 'tidak_layak') as tidak_layak,
  count(u.id) filter (where u.status = 'tersedia' and u.kondisi = 'layak')   as tersedia,
  count(u.id) filter (where u.status = 'dipinjam')                           as dipinjam,
  coalesce(sum(u.harga) filter (where u.status <> 'nonaktif'), 0)            as nilai
from public.barang_jenis j
left join public.barang_unit u on u.jenis_id = j.id
group by j.id;

create or replace view public.v_tunggakan as
with cfg as (
  select coalesce((select nilai::date from public.rmb_pengaturan where kunci = 'kas_mulai'), date_trunc('month', current_date)::date) as mulai,
         coalesce((select nilai::numeric from public.rmb_pengaturan where kunci = 'kas_nominal'), 25000) as nominal
), bulan as (
  select generate_series(cfg.mulai, date_trunc('month', current_date)::date, interval '1 month')::date as periode from cfg
)
select a.id as anggota_id, a.nama_adat, a.nama_lengkap, b.periode, cfg.nominal
from public.anggota a cross join cfg cross join bulan b
where a.aktif and a.jabatan::text <> 'alumni'
  and not exists (select 1 from public.kas_iuran k where k.anggota_id = a.id and k.periode = b.periode and k.status in ('menunggu','terverifikasi'));

-- ---------- 7. Fungsi proses (hanya dipanggil server lewat service_role) ----
create or replace function public.rmb_pinjam_serahkan(p_id uuid, p_actor uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.pinjam%rowtype; it record; ids uuid[]; n int; idx int := 0;
begin
  select * into p from public.pinjam where id = p_id for update;
  if not found then raise exception 'Peminjaman tidak ditemukan.'; end if;
  if p.status <> 'menunggu' then raise exception 'Peminjaman ini sudah diproses (status: %).', p.status; end if;
  if not exists (select 1 from public.pinjam_item where pinjam_id = p_id) then raise exception 'Peminjaman belum punya barang.'; end if;

  for it in select i.id, i.jenis_id, i.jumlah, j.nama from public.pinjam_item i
            join public.barang_jenis j on j.id = i.jenis_id where i.pinjam_id = p_id order by i.id loop
    idx := idx + 1;
    if p.tipe = 'kita_pinjam' then
      with baru as (
        insert into public.barang_unit (jenis_id, nomor, kondisi, status, pemilik_mapala_id, batas_kembali, keterangan)
        select it.jenis_id, 'TMP-' || p.kode || '-' || idx || '-' || g, 'layak', 'tersedia', p.mapala_id, p.tgl_rencana_kembali, 'Pinjaman sementara (' || p.kode || ')'
        from generate_series(1, it.jumlah) g returning id)
      insert into public.pinjam_unit (pinjam_id, unit_id) select p_id, id from baru;
    else
      select array_agg(u.id) into ids from (
        select id from public.barang_unit
        where jenis_id = it.jenis_id and status = 'tersedia' and kondisi = 'layak'
          and (pemilik_mapala_id is null or p.tipe <> 'mapala_pinjam')
        order by nomor limit it.jumlah for update skip locked) u;
      n := coalesce(array_length(ids, 1), 0);
      if n < it.jumlah then
        raise exception 'Stok "%" tidak cukup: diminta %, tersedia %.', it.nama, it.jumlah, n;
      end if;
      update public.barang_unit set status = 'dipinjam' where id = any(ids);
      insert into public.pinjam_unit (pinjam_id, unit_id) select p_id, unnest(ids);
    end if;
  end loop;
  update public.pinjam set status = 'dipinjam', diproses_oleh = p_actor where id = p_id;
end $$;

create or replace function public.rmb_pinjam_kembali(p_id uuid, p_actor uuid, p_kondisi jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p public.pinjam%rowtype; u record; k text;
begin
  select * into p from public.pinjam where id = p_id for update;
  if not found then raise exception 'Peminjaman tidak ditemukan.'; end if;
  if p.status <> 'dipinjam' then raise exception 'Hanya peminjaman berstatus "dipinjam" yang bisa dikembalikan.'; end if;
  if p.tipe = 'kita_pinjam' and exists (
      select 1 from public.pinjam_unit pu join public.barang_unit bu on bu.id = pu.unit_id
      where pu.pinjam_id = p_id and bu.status = 'dipinjam') then
    raise exception 'Sebagian alat pinjaman ini masih dipakai anggota. Kembalikan dulu peminjaman anggota tersebut.';
  end if;
  for u in select unit_id from public.pinjam_unit where pinjam_id = p_id loop
    k := p_kondisi ->> u.unit_id::text;
    if k not in ('layak','tidak_layak') then k := null; end if;
    if p.tipe = 'kita_pinjam' then
      update public.barang_unit set status = 'nonaktif' where id = u.unit_id;
    else
      update public.barang_unit set status = 'tersedia', kondisi = coalesce(k, kondisi) where id = u.unit_id;
    end if;
    update public.pinjam_unit set kondisi_kembali = k where pinjam_id = p_id and unit_id = u.unit_id;
  end loop;
  update public.pinjam set status = 'dikembalikan', tgl_kembali = current_date, diproses_oleh = p_actor where id = p_id;
end $$;

create or replace function public.rmb_pinjam_tolak(p_id uuid, p_actor uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.pinjam set status = 'ditolak', catatan = p_catatan, diproses_oleh = p_actor
   where id = p_id and status = 'menunggu';
  if not found then raise exception 'Hanya permintaan berstatus "menunggu" yang bisa ditolak.'; end if;
end $$;

create or replace function public.rmb_buat_surat_keluar(
  p_kategori text, p_tanggal date, p_perihal text, p_pihak text, p_ringkasan text, p_file text,
  p_actor uuid, p_kegiatan uuid default null, p_pinjam uuid default null) returns public.surat_arsip
language plpgsql security definer set search_path = public as $$
declare v_kode text; v_urut int; r public.surat_arsip;
        v_rom text[] := array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
begin
  -- FORMAT NOMOR SURAT: ubah bagian ini kalau format resmi Rimbawana berbeda.
  -- Hasil contoh: 007/RMB-UPI/UND/XI/2026
  v_kode := case p_kategori when 'undangan' then 'UND' when 'peminjaman' then 'PNJ' when 'proposal' then 'PRP'
            when 'lpj' then 'LPJ' when 'pemberitahuan' then 'PBH' when 'permohonan' then 'PMH' else 'SRT' end;
  insert into public.surat_nomor (tahun, kode, terakhir) values (extract(year from p_tanggal)::int, v_kode, 1)
  on conflict (tahun, kode) do update set terakhir = public.surat_nomor.terakhir + 1
  returning terakhir into v_urut;
  insert into public.surat_arsip (arah, kategori, nomor, urut, tanggal, perihal, pihak, ringkasan, file_path, dibuat_oleh, kegiatan_id, pinjam_id)
  values ('keluar', p_kategori,
          lpad(v_urut::text, 3, '0') || '/RMB-UPI/' || v_kode || '/' || v_rom[extract(month from p_tanggal)::int] || '/' || extract(year from p_tanggal)::int,
          v_urut, p_tanggal, p_perihal, p_pihak, p_ringkasan, p_file, p_actor, p_kegiatan, p_pinjam)
  returning * into r;
  return r;
end $$;

create or replace function public.rmb_kas_bayar(p_anggota uuid, p_periode date[], p_metode text, p_bukti text, p_actor uuid, p_langsung boolean) returns int
language plpgsql security definer set search_path = public as $$
declare v_nominal numeric; v_nama text; v_d date; v_p date; v_id uuid; v_n int := 0;
begin
  select coalesce((select nilai::numeric from public.rmb_pengaturan where kunci = 'kas_nominal'), 25000) into v_nominal;
  select nama_adat into v_nama from public.anggota where id = p_anggota;
  if v_nama is null then raise exception 'Anggota tidak ditemukan.'; end if;
  if p_periode is null or array_length(p_periode, 1) is null then raise exception 'Pilih minimal satu bulan.'; end if;
  foreach v_p in array p_periode loop
    v_d := date_trunc('month', v_p)::date;
    if exists (select 1 from public.kas_iuran where anggota_id = p_anggota and periode = v_d and status in ('menunggu','terverifikasi')) then
      raise exception 'Kas bulan % sudah tercatat.', to_char(v_d, 'MM/YYYY');
    end if;
    insert into public.kas_iuran (anggota_id, periode, jumlah, metode, bukti_path, status, diverifikasi_oleh, tgl_verifikasi)
    values (p_anggota, v_d, v_nominal, p_metode, nullif(p_bukti, ''),
            case when p_langsung then 'terverifikasi' else 'menunggu' end,
            case when p_langsung then p_actor end, case when p_langsung then now() end)
    returning id into v_id;
    if p_langsung then
      insert into public.buku_kas (tanggal, tipe, kategori, jumlah, keterangan, kas_iuran_id, bukti_path, dibuat_oleh)
      values (current_date, 'masuk', 'kas', v_nominal, 'Kas ' || to_char(v_d, 'MM/YYYY') || ' - ' || v_nama, v_id, nullif(p_bukti, ''), p_actor);
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

create or replace function public.rmb_kas_verifikasi(p_id uuid, p_actor uuid, p_setuju boolean, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare k public.kas_iuran%rowtype; v_nama text;
begin
  select * into k from public.kas_iuran where id = p_id for update;
  if not found then raise exception 'Pembayaran tidak ditemukan.'; end if;
  if k.status <> 'menunggu' then raise exception 'Pembayaran ini sudah diverifikasi.'; end if;
  if p_setuju then
    select nama_adat into v_nama from public.anggota where id = k.anggota_id;
    update public.kas_iuran set status = 'terverifikasi', diverifikasi_oleh = p_actor, tgl_verifikasi = now(), catatan = p_catatan where id = p_id;
    insert into public.buku_kas (tanggal, tipe, kategori, jumlah, keterangan, kas_iuran_id, bukti_path, dibuat_oleh)
    values (current_date, 'masuk', 'kas', k.jumlah, 'Kas ' || to_char(k.periode, 'MM/YYYY') || ' - ' || coalesce(v_nama, '?'), p_id, k.bukti_path, p_actor);
  else
    update public.kas_iuran set status = 'ditolak', diverifikasi_oleh = p_actor, tgl_verifikasi = now(), catatan = p_catatan where id = p_id;
  end if;
end $$;

-- ---------- 8. Keamanan ----------------------------------------------------
-- Semua tabel baru: RLS aktif TANPA policy = tidak bisa diakses langsung dari browser.
-- Aplikasi membaca/menulis lewat server (kunci service_role) setelah cek peran.
do $$
declare t text;
begin
  foreach t in array array['lokasi_simpan','mapala_mitra','barang_jenis','barang_unit','kegiatan_rab','pinjam','pinjam_item','pinjam_unit',
                           'surat_nomor','surat_arsip','rmb_pengaturan','kas_iuran','buku_kas'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

revoke all on public.v_stok_jenis, public.v_tunggakan from anon, authenticated;
revoke execute on function public.rmb_pinjam_serahkan(uuid, uuid), public.rmb_pinjam_kembali(uuid, uuid, jsonb),
  public.rmb_pinjam_tolak(uuid, uuid, text),
  public.rmb_buat_surat_keluar(text, date, text, text, text, text, uuid, uuid, uuid),
  public.rmb_kas_bayar(uuid, date[], text, text, uuid, boolean),
  public.rmb_kas_verifikasi(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.rmb_pinjam_serahkan(uuid, uuid), public.rmb_pinjam_kembali(uuid, uuid, jsonb),
  public.rmb_pinjam_tolak(uuid, uuid, text),
  public.rmb_buat_surat_keluar(text, date, text, text, text, text, uuid, uuid, uuid),
  public.rmb_kas_bayar(uuid, date[], text, text, uuid, boolean),
  public.rmb_kas_verifikasi(uuid, uuid, boolean, text) to service_role;

-- ---------- 9. Penyimpanan berkas (Storage) --------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('arsip', 'arsip', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp']),
  ('foto',  'foto',  true,  3145728,  array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "rmb_arsip_unggah" on storage.objects;
create policy "rmb_arsip_unggah" on storage.objects for insert to authenticated with check (bucket_id = 'arsip');
drop policy if exists "rmb_foto_unggah" on storage.objects;
create policy "rmb_foto_unggah" on storage.objects for insert to authenticated with check (bucket_id = 'foto' and public.rmb_is_pengurus());

-- Muat ulang cache skema API Supabase agar tabel baru langsung terbaca
notify pgrst, 'reload schema';
