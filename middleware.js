import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
// Halaman di bawah ini wajib login. Halaman publik (/, /tentang, /katalog, /pinjam, /u/..., /login) tidak termasuk.
export async function middleware(request) {
  let res = NextResponse.next({ request })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => request.cookies.getAll(),
      setAll: (l) => { l.forEach(({ name, value }) => request.cookies.set(name, value))
        res = NextResponse.next({ request }); l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) } } })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  return res
}
export const config = { matcher: ['/dashboard/:path*', '/anggota/:path*', '/ganti-password/:path*', '/barang/:path*',
  '/peminjaman/:path*', '/surat/:path*', '/kas/:path*', '/keuangan/:path*', '/kegiatan/:path*', '/lokasi/:path*', '/mapala/:path*', '/api/:path*'] }
