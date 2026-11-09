-- ============================================================================
-- RIMBAWANA WEB - 06 DATA ANGKATAN PER TAHUN
-- Menambah kolom tahun dan keterangan pada tabel angkatan, dan membuat singkatan (kolom "kode") OPSIONAL.
-- Dipakai untuk halaman sejarah per tahun dan pilihan angkatan di data anggota.
-- Jalankan SETELAH 01-04. Aman dijalankan berulang. Data angkatan yang sudah ada (mis. SPG) tidak diubah.
-- ============================================================================
do $$
declare c record;
begin
  -- singkatan (kolom "kode") boleh kosong
  alter table public.angkatan alter column kode drop not null;
  -- hapus aturan CHECK lama yang membatasi format kode (kalau ada), karena singkatan kini opsional
  for c in select conname from pg_constraint
           where conrelid = 'public.angkatan'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%kode%' loop
    execute format('alter table public.angkatan drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.angkatan add column if not exists tahun int;
alter table public.angkatan add column if not exists keterangan text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'angkatan_tahun_cek') then
    alter table public.angkatan add constraint angkatan_tahun_cek check (tahun is null or tahun between 1990 and 2100);
  end if;
end $$;
-- nama angkatan tidak boleh kembar (tanpa membedakan huruf besar/kecil)
create unique index if not exists angkatan_nama_unik on public.angkatan (lower(nama));
create index if not exists angkatan_tahun_idx on public.angkatan (tahun);

notify pgrst, 'reload schema';
