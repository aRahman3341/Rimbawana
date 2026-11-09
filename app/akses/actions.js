'use server'
import { revalidatePath } from 'next/cache'
import { izinFounder, KUNCI_IZIN, PERAN_ATUR } from '@/lib/auth'
import { admin, teks } from '@/lib/db'

const segar = () => { ['/akses', '/bantuan', '/dashboard'].forEach(p => revalidatePath(p)); revalidatePath('/', 'layout') }
const pesanDb = (e) => /akses_(role|pengguna|permintaan)/.test(e.message) && /exist|schema cache/i.test(e.message)
  ? 'Tabel akses belum ada. Jalankan supabase/07_akses_cs_founder.sql di Supabase SQL Editor.' : e.message

// Simpan seluruh matriks peran x izin sekaligus.
export async function simpanMatriks(_p, fd) {
  const z = await izinFounder(); if (z.error) return z
  const dipilih = new Set()
  for (const [k] of fd.entries()) {
    const m = /^m__([A-Za-z]+)__([a-z_]+)$/.exec(k)
    if (m && KUNCI_IZIN.includes(m[1]) && PERAN_ATUR.includes(m[2])) dipilih.add(`${m[2]}|${m[1]}`)
  }
  if (!dipilih.size) return { error: 'Minimal satu izin harus diberikan ke sebuah peran.' }
  const adm = admin()
  const { data: ada, error } = await adm.from('akses_role').select('role,izin')
  if (error) return { error: pesanDb(error) }
  const adaSet = new Set(ada.map(x => `${x.role}|${x.izin}`))
  const tambah = [...dipilih].filter(x => !adaSet.has(x)).map(x => { const [role, izin] = x.split('|'); return { role, izin } })
  const hapus = ada.filter(x => !dipilih.has(`${x.role}|${x.izin}`))
  if (tambah.length) { const { error: e } = await adm.from('akses_role').insert(tambah); if (e) return { error: pesanDb(e) } }
  for (const h of hapus) await adm.from('akses_role').delete().eq('role', h.role).eq('izin', h.izin)
  segar(); return { ok: `Tersimpan: ${tambah.length} izin ditambahkan, ${hapus.length} dicabut. Berlaku langsung.` }
}

// Izin tambahan untuk satu orang.
export async function tambahHakOrang(_p, fd) {
  const z = await izinFounder(); if (z.error) return z
  const anggota_id = teks(fd, 'anggota_id'), izin = teks(fd, 'izin')
  if (!anggota_id || !KUNCI_IZIN.includes(izin)) return { error: 'Pilih orang dan izinnya.' }
  const adm = admin()
  const { data: a } = await adm.from('anggota').select('peran').eq('id', anggota_id).maybeSingle()
  if (!a || a.peran === 'founder') return { error: 'Anggota tidak ditemukan.' }
  const { error } = await adm.from('akses_pengguna').upsert({ anggota_id, izin, alasan: teks(fd, 'alasan'), diberikan_oleh: z.saya.id })
  if (error) return { error: pesanDb(error) }
  segar(); return { ok: 'Izin tambahan diberikan.' }
}
export async function cabutHakOrang(fd) {
  const z = await izinFounder(); if (z.error) return
  await admin().from('akses_pengguna').delete().eq('anggota_id', teks(fd, 'anggota_id')).eq('izin', teks(fd, 'izin')); segar()
}

// Jawab permintaan dari CS Founder. Disetujui = orang itu mendapat izin yang diminta.
export async function putuskanPermintaan(_p, fd) {
  const z = await izinFounder(); if (z.error) return z
  const id = teks(fd, 'id'), setuju = teks(fd, 'aksi') === 'setuju', balasan = teks(fd, 'balasan')
  const adm = admin()
  const { data: p } = await adm.from('akses_permintaan').select('*').eq('id', id).maybeSingle()
  if (!p || p.status !== 'baru') return { error: 'Permintaan ini sudah dijawab.' }
  if (setuju && p.izin) {
    const { error } = await adm.from('akses_pengguna').upsert({ anggota_id: p.anggota_id, izin: p.izin, alasan: 'Permintaan lewat CS Founder', diberikan_oleh: z.saya.id })
    if (error) return { error: pesanDb(error) }
  }
  await adm.from('akses_permintaan').update({ status: setuju ? 'disetujui' : 'ditolak', balasan, diputuskan_pada: new Date().toISOString() }).eq('id', id)
  segar(); return { ok: setuju ? 'Disetujui.' : 'Ditolak.' }
}
