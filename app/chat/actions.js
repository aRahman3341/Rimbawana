'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSaya, boleh } from '@/lib/auth'
import { admin, teks } from '@/lib/db'
import { aksesRuang, MEET_RE, bolehChat } from '@/lib/chat'

const segar = (id) => { revalidatePath('/chat'); if (id) revalidatePath(`/chat/${id}`); revalidatePath('/dashboard') }
async function ruangTulis(fd) {
  const saya = await getSaya(); if (!saya) return { error: 'Sesi habis. Silakan login lagi.' }
  const adm = admin(), id = teks(fd, 'ruang_id')
  const a = await aksesRuang(adm, saya, id)
  if (!a) return { error: 'Ruang tidak ditemukan.' }
  if (!a.bisaKirim) return { error: a.ruang.arsip ? 'Ruang ini sudah diarsipkan (hanya bisa dibaca).' : 'Akun ini hanya bisa membaca.' }
  return { saya, adm, id, a }
}

export async function kirimPesan(_p, fd) {
  const z = await ruangTulis(fd); if (z.error) return z
  const isi = teks(fd, 'isi'); if (!isi) return { error: 'Pesan kosong.' }
  if (isi.length > 2000) return { error: 'Pesan terlalu panjang (maksimal 2000 karakter).' }
  const { error } = await z.adm.from('chat_pesan').insert({ ruang_id: z.id, pengirim_id: z.saya.id, jenis: 'teks', isi })
  return error ? { error: error.message } : { ok: true }
}

export async function kirimMeet(_p, fd) {
  const z = await ruangTulis(fd); if (z.error) return z
  const url = teks(fd, 'url'), judul = teks(fd, 'judul') || 'Rapat online', waktu = teks(fd, 'waktu')
  if (!url || !MEET_RE.test(url)) return { error: 'Link harus link Google Meet, contoh: https://meet.google.com/abc-defg-hij' }
  if (waktu && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(waktu)) return { error: 'Waktu tidak valid.' }
  const { error } = await z.adm.from('chat_pesan').insert({ ruang_id: z.id, pengirim_id: z.saya.id, jenis: 'meet', meet_url: url, meet_judul: judul.slice(0, 120),
    meet_waktu: waktu ? `${waktu}:00+07:00` : null, isi: teks(fd, 'catatan') })
  return error ? { error: error.message } : { ok: true }
}

export async function hapusPesan(fd) {
  const saya = await getSaya(); if (!saya) return
  const adm = admin(), id = Number(fd.get('id'))
  const { data: p } = await adm.from('chat_pesan').select('id,ruang_id,pengirim_id').eq('id', id).maybeSingle()
  if (!p) return
  const a = await aksesRuang(adm, saya, p.ruang_id)
  if (!a || !(a.admin || p.pengirim_id === saya.id)) return
  await adm.from('chat_pesan').update({ dihapus: true }).eq('id', id); segar(p.ruang_id)
}

export async function buatRuang(_p, fd) {
  const saya = await getSaya()
  if (!saya || !boleh(saya, 'chatAdmin')) return { error: 'Hanya Ketua Adat atau Sekretaris yang bisa membuat ruang chat.' }
  const nama = teks(fd, 'nama'), tipe = teks(fd, 'tipe') === 'umum' ? 'umum' : 'khusus'
  if (!nama) return { error: 'Nama ruang wajib diisi.' }
  const adm = admin()
  const { data: r, error } = await adm.from('chat_ruang').insert({ nama, deskripsi: teks(fd, 'deskripsi'), tipe, dibuat_oleh: saya.id }).select('id').single()
  if (error) return { error: error.message }
  const anggota = [...new Set([...fd.getAll('anggota').map(String), saya.id])]
  if (tipe === 'khusus' && saya.peran !== 'founder') {
    await adm.from('chat_anggota').insert(anggota.map(id => ({ ruang_id: r.id, anggota_id: id, admin: id === saya.id })))
  }
  segar(); redirect(`/chat/${r.id}`)
}

async function ruangAdmin(fd) {
  const saya = await getSaya(); if (!saya) return null
  const adm = admin(), id = teks(fd, 'ruang_id'), a = await aksesRuang(adm, saya, id)
  return a?.admin ? { adm, id, a, saya } : null
}
export async function tambahAnggotaRuang(fd) {
  const z = await ruangAdmin(fd); if (!z) return
  const aid = teks(fd, 'anggota_id'); if (!aid) return
  if (!(await bolehChat(z.adm, aid))) return          // hanya yang punya izin melihat halaman pengurus (diatur Founder)
  await z.adm.from('chat_anggota').upsert({ ruang_id: z.id, anggota_id: aid, admin: false }); segar(z.id)
}
export async function keluarkanAnggotaRuang(fd) {
  const z = await ruangAdmin(fd); if (!z) return
  await z.adm.from('chat_anggota').delete().eq('ruang_id', z.id).eq('anggota_id', teks(fd, 'anggota_id')); segar(z.id)
}
export async function jadikanAdminRuang(fd) {
  const z = await ruangAdmin(fd); if (!z) return
  await z.adm.from('chat_anggota').update({ admin: fd.get('admin') === '1' }).eq('ruang_id', z.id).eq('anggota_id', teks(fd, 'anggota_id')); segar(z.id)
}
export async function arsipkanRuang(fd) {
  const z = await ruangAdmin(fd); if (!z) return
  await z.adm.from('chat_ruang').update({ arsip: fd.get('arsip') === '1' }).eq('id', z.id); segar(z.id)
}
export async function hapusRuang(fd) {
  const z = await ruangAdmin(fd); if (!z) return
  await z.adm.from('chat_ruang').delete().eq('id', z.id); segar(); redirect('/chat')
}
