import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUsersClient from '@/components/AdminUsersClient'

const ADMIN_EMAIL = 'hajimeazb@gmail.com'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  if (user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  return <AdminUsersClient user={user} />
}
