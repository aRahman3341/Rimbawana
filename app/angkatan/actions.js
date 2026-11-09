'use server'
import { revalidatePath } from 'next/cache'
import { izinAksi } from '@/lib/auth'
import { admin, teks } from '@/lib/db'
import { rapikanSingkatan, tahunIni } from '@/lib/angkatan'

const segar = () => { revalidatePath('/angkatan'); revalidatePath('/tentang'); revalidatePath('/anggota') }
const pesanDb = (e) => e.code === '23505' ? 'Nama angkatan itu sudah ada (nama angkatan tidak boleh kembar).'
  : e.code === '23514' ? 'Tahun tidak valid.' : e.message

function bacaTahun(v) {
  const t = Number(v)
  return Number.isInteger(t) && t >= 1990 && t <= tahunIni() + 1 ? t : null
}

export async function tambahAngkatan(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const nama = teks(fd, 'nama'), tahun = bacaTahun(fd.get('tahun'))
  if (!nama) return { error: 'Nama angkatan wajib diisi.' }
  if (!tahun) return { error: 'Pilih tahun yang valid.' }
  const { error } = await admin().from('angkatan').insert({ nama: nama.slice(0, 80), kode: rapikanSingkatan(fd.get('kode')), tahun, keterangan: teks(fd, 'keterangan') })
  if (error) return { error: pesanDb(error) }
  segar(); return { ok: `Angkatan "${nama}" ditambahkan untuk tahun ${tahun}.` }
}

// Isi massal. Satu baris satu angkatan:  tahun | nama angkatan | singkatan (boleh kosong)
export async function tambahMassal(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const baris = String(fd.get('teks') || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 200)
  if (!baris.length) return { error: 'Tempel minimal satu baris.' }
  const adm = admin(), gagal = []
  let ok = 0
  for (const [i, b] of baris.entries()) {
    const [t, nama, kode] = b.split('|').map(x => x.trim())
    const tahun = bacaTahun(t)
    if (!tahun || !nama) { gagal.push(`baris ${i + 1}: format harus "tahun | nama | singkatan"`); continue }
    const { error } = await adm.from('angkatan').insert({ nama: nama.slice(0, 80), kode: rapikanSingkatan(kode), tahun })
    if (error) gagal.push(`baris ${i + 1} (${nama}): ${pesanDb(error)}`); else ok++
  }
  segar()
  if (!ok) return { error: gagal.slice(0, 4).join(' | ') }
  return { ok: `${ok} angkatan ditambahkan.${gagal.length ? ` Dilewati ${gagal.length}: ${gagal.slice(0, 3).join(' | ')}` : ''}` }
}

export async function ubahAngkatan(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const id = teks(fd, 'id'), nama = teks(fd, 'nama'), tahun = bacaTahun(fd.get('tahun'))
  if (!id || !nama) return { error: 'Nama angkatan wajib diisi.' }
  if (!tahun) return { error: 'Pilih tahun yang valid.' }
  const { error } = await admin().from('angkatan').update({ nama: nama.slice(0, 80), kode: rapikanSingkatan(fd.get('kode')), tahun, keterangan: teks(fd, 'keterangan') }).eq('id', id)
  if (error) return { error: pesanDb(error) }
  segar(); return { ok: 'Perubahan disimpan.' }
}

export async function hapusAngkatan(_p, fd) {
  const z = await izinAksi('profil'); if (z.error) return z
  const id = teks(fd, 'id'), adm = admin()
  const { count } = await adm.from('anggota').select('id', { count: 'exact', head: true }).eq('angkatan_id', id)
  if (count) return { error: `Masih dipakai ${count} anggota. Pindahkan angkatan anggota tersebut dulu di menu Anggota.` }
  const { error } = await adm.from('angkatan').delete().eq('id', id)
  if (error) return { error: pesanDb(error) }
  segar(); return { ok: 'Angkatan dihapus.' }
}
