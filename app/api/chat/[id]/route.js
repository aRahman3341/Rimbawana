import { NextResponse } from 'next/server'
import { getSaya } from '@/lib/auth'
import { admin } from '@/lib/db'
import { aksesRuang, KOLOM_PESAN, bersihPesan, tandaiBaca } from '@/lib/chat'
export const dynamic = 'force-dynamic'

// Dipanggil browser tiap beberapa detik untuk mengambil pesan baru.
export async function GET(req, { params }) {
  const saya = await getSaya()
  if (!saya) return NextResponse.json({ error: 'login' }, { status: 401 })
  const adm = admin()
  const a = await aksesRuang(adm, saya, params.id)
  if (!a) return NextResponse.json({ error: 'tidak ada akses' }, { status: 404 })
  const after = Math.max(Number(new URL(req.url).searchParams.get('after')) || 0, 0)
  const { data, error } = await adm.from('chat_pesan').select(KOLOM_PESAN).eq('ruang_id', params.id).gt('id', after).order('id').limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data.length) await tandaiBaca(adm, saya, params.id, data[data.length - 1].id)
  return NextResponse.json({ pesan: data.map(bersihPesan), arsip: a.ruang.arsip })
}
