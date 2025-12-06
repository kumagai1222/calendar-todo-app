'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CalendarView from './CalendarView'
import TodoList from './TodoList'

interface DashboardClientProps {
  user: User
}

const ADMIN_EMAIL = 'hajimeazb@gmail.com'

export default function DashboardClient({ user }: DashboardClientProps) {
  const [view, setView] = useState<'calendar' | 'todo'>('calendar')
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = user.email === ADMIN_EMAIL


  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Use window.location for a clean redirect after logout
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              カレンダー & Todo
            </h1>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <>
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded">
                    管理者
                  </span>
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                  >
                    ユーザー管理
                  </button>
                </>
              )}
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setView('calendar')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'calendar'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            カレンダー
          </button>
          <button
            onClick={() => setView('todo')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'todo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Todoリスト
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'calendar' ? (
          <CalendarView userId={user.id} />
        ) : (
          <TodoList userId={user.id} />
        )}
      </main>
    </div>
  )
}
