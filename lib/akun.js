// Label tampilan.
export const STATUS = { AM: 'Anggota Muda (AM)', AP: 'Anggota Penuh (AP)' }
export const PERAN = { founder: 'Admin sistem', ketua_adat: 'Ketua Adat', sekretaris: 'Sekretaris', bendahara: 'Bendahara', perlengkapan: 'Perlengkapan', bpr: 'Badan Pengawas (BPR)', anggota: '-' }

// Email teknis untuk Supabase Auth, dibuat dari nama adat (tidak untuk dikirimi email)
export function emailTeknis(namaAdat) {
  const slug = namaAdat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'anggota'}@${process.env.EMAIL_DOMAIN_TEKNIS || 'anggota.invalid'}`
}

// Peringkat wewenang. Founder boleh mengelola semua; selain itu hanya yang peringkatnya LEBIH TINGGI dari target.
export const RANK = { founder: 4, ketua_adat: 3, sekretaris: 2, bendahara: 2, perlengkapan: 2, bpr: 2, anggota: 1 }
export const bolehKelola = (saya, target) => !!saya && (saya === 'founder' || (RANK[saya] || 0) > (RANK[target] || 0))
