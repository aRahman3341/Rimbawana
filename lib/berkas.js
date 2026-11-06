import { createAdmin } from '@/lib/supabase/admin'
// Tautan sementara (1 jam) untuk berkas privat di bucket "arsip". Hasil: { [path]: url }
export async function urlArsip(paths) {
  const unik = [...new Set((paths || []).filter(Boolean))]
  if (!unik.length) return {}
  const { data } = await createAdmin().storage.from('arsip').createSignedUrls(unik, 3600)
  const peta = {}
  ;(data || []).forEach(d => { if (d.signedUrl) peta[d.path] = d.signedUrl })
  return peta
}
export const urlFoto = (path) => path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/foto/${path}` : null
