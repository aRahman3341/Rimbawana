import '@fontsource/anton/400.css'
import '@fontsource-variable/plus-jakarta-sans'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import { getLogo } from '@/lib/profil'
export async function generateMetadata() {
  return {
    title: { default: 'Rimbawana UPI Kampus Cibiru', template: '%s | Rimbawana' },
    description: 'UKM Rimbawana - Universitas Pendidikan Indonesia, Kampus di Cibiru. Pendidikan dan lingkungan.',
    icons: { icon: await getLogo() },
  }
}
export default function Root({ children }) { return (<html lang="id"><body>{children}</body></html>) }
