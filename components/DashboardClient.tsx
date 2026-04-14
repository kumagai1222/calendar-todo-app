'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CalendarView from './CalendarView'
import WeeklyCalendar from './WeeklyCalendar'
import TodoList from './TodoList'
import NotificationSettings from './NotificationSettings'
import { KLMSSettings } from './KLMSSettings'
import { useEventNotifications } from '@/lib/hooks/useEventNotifications'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Todo = Database['public']['Tables']['todos']['Row']

interface DashboardClientProps {
  user: User
}

const ADMIN_EMAIL = 'hajimeazb@gmail.com'

export default function DashboardClient({ user }: DashboardClientProps) {
  const [view, setView] = useState<'calendar' | 'weekly' | 'todo' | 'klms'>('calendar')
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [resetCalendarToMonth, setResetCalendarToMonth] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = user.email === ADMIN_EMAIL

  useEffect(() => {
    // Load notification setting
    const saved = localStorage.getItem('notificationsEnabled')
    setNotificationsEnabled(saved === 'true')

    // Load all events and todos for notifications
    loadEventsAndTodos()

    // Reload events and todos every minute to keep data fresh
    const interval = setInterval(() => {
      loadEventsAndTodos()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  const loadEventsAndTodos = async () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days

    console.log('[DashboardClient] Loading events and todos...', {
      from: now.toISOString(),
      to: futureDate.toISOString()
    })

    const [eventsResult, todosResult] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', now.toISOString())
        .lte('start_date', futureDate.toISOString()),
      supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .not('deadline', 'is', null)
        .eq('is_completed', false)
    ])

    if (eventsResult.data) {
      setEvents(eventsResult.data)
      console.log('[DashboardClient] Loaded events:', eventsResult.data.length, eventsResult.data)
    }
    if (todosResult.data) {
      setTodos(todosResult.data)
      console.log('[DashboardClient] Loaded todos:', todosResult.data.length, todosResult.data)
    }
  }

  // Use notification hook
  useEventNotifications({
    events,
    todos,
    enabled: notificationsEnabled
  })

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
              <button
                onClick={() => setIsNotificationSettingsOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="通知設定"
                title="通知設定"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
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
            onClick={() => {
              setView('calendar')
              // Reset calendar to month view when tab is clicked
              setResetCalendarToMonth(prev => !prev)
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'calendar'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            カレンダー
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'weekly'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            時間割
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
          <button
            onClick={() => setView('klms')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'klms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            KLMS連携
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'calendar' ? (
          <CalendarView userId={user.id} resetToMonth={resetCalendarToMonth} />
        ) : view === 'weekly' ? (
          <WeeklyCalendar userId={user.id} />
        ) : view === 'todo' ? (
          <TodoList userId={user.id} />
        ) : (
          <KLMSSettings />
        )}
      </main>

      {/* Notification Settings Modal */}
      {isNotificationSettingsOpen && (
        <NotificationSettings
          onClose={() => {
            setIsNotificationSettingsOpen(false)
            // Reload notification setting
            const saved = localStorage.getItem('notificationsEnabled')
            setNotificationsEnabled(saved === 'true')
          }}
        />
      )}
    </div>
  )
}
