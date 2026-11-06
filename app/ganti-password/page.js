'use client'
import InputPassword from '@/components/InputPassword'
import { useFormState } from 'react-dom'
import { gantiPassword } from './actions'
export default function Ganti() {
  const [s, aksi] = useFormState(gantiPassword, null)
  return (<main><form className="kartu" action={aksi}>
    <h1>Ganti Password</h1><p>Buat password baru sebelum melanjutkan.</p>
    <label>Password baru</label><InputPassword name="baru" autoComplete="new-password" />
    <label>Ulangi password</label><InputPassword name="ulang" autoComplete="new-password" />
    <p className="err">{s?.error}</p><button>Simpan</button>
  </form></main>)
}
