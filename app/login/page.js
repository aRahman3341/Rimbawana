import LoginForm from './LoginForm'
import { getLogo } from '@/lib/profil'
export const dynamic = 'force-dynamic'
export default async function Login() { return <LoginForm logo={await getLogo()} /> }
