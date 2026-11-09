// Pembantu data angkatan. Singkatan disimpan di kolom "kode" dan boleh kosong.
export const labelAngkatan = (a) => a.kode ? `${a.nama} (${a.kode})` : a.nama
export const rapikanSingkatan = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || null
export const tahunIni = () => Number(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 4))
