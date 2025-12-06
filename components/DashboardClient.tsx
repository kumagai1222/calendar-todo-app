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
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              カレンダー & Todo
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {isAdmin && (
                <>
                  <span className="hidden sm:inline px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded">
                    管理者
                  </span>
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                  >
                    ユーザー管理
                  </button>
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="sm:hidden p-2 text-white bg-purple-600 rounded hover:bg-purple-700"
                    aria-label="ユーザー管理"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </button>
                </>
              )}
              <span className="hidden sm:inline text-sm text-gray-600 truncate max-w-[150px]">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 whitespace-nowrap"
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
