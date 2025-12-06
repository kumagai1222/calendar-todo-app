'use client'

import { useEffect } from 'react'
import { Database } from '@/lib/types/database.types'
import { useNotifications } from './useNotifications'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Todo = Database['public']['Tables']['todos']['Row']

interface UseEventNotificationsProps {
  events: CalendarEvent[]
  todos: Todo[]
  enabled: boolean
}

export function useEventNotifications({ events, todos, enabled }: UseEventNotificationsProps) {
  const { showNotification, permission } = useNotifications()

  useEffect(() => {
    if (!enabled || permission !== 'granted') {
      return
    }

    // Check events and todos every minute
    const checkNotifications = () => {
      const now = new Date()
      const nowTime = now.getTime()

      // Check events starting in the next 15 minutes
      events.forEach((event) => {
        const startTime = new Date(event.start_date).getTime()
        const timeDiff = startTime - nowTime
        const minutesUntilStart = Math.floor(timeDiff / 1000 / 60)

        // Notify 15 minutes before
        if (minutesUntilStart === 15) {
          showNotification('予定のリマインダー', {
            body: `${event.title} が15分後に始まります`,
            tag: `event-${event.id}`,
          })
        }

        // Notify 5 minutes before
        if (minutesUntilStart === 5) {
          showNotification('予定のリマインダー', {
            body: `${event.title} が5分後に始まります`,
            tag: `event-${event.id}-5min`,
          })
        }

        // Notify when starting
        if (minutesUntilStart === 0) {
          showNotification('予定が始まります', {
            body: event.title,
            tag: `event-${event.id}-start`,
          })
        }
      })

      // Check todos with upcoming deadlines
      todos.forEach((todo) => {
        if (!todo.deadline || todo.is_completed) {
          return
        }

        const deadlineTime = new Date(todo.deadline).getTime()
        const timeDiff = deadlineTime - nowTime
        const hoursUntilDeadline = Math.floor(timeDiff / 1000 / 60 / 60)

        // Notify 1 day before (24 hours)
        if (hoursUntilDeadline === 24) {
          showNotification('Todo締切のリマインダー', {
            body: `${todo.title} の締切が明日です`,
            tag: `todo-${todo.id}-1day`,
          })
        }

        // Notify 1 hour before
        if (hoursUntilDeadline === 1) {
          showNotification('Todo締切が近づいています', {
            body: `${todo.title} の締切が1時間後です`,
            tag: `todo-${todo.id}-1hour`,
          })
        }

        // Notify when overdue
        if (hoursUntilDeadline === 0 && timeDiff < 0) {
          const minutesOverdue = Math.abs(Math.floor(timeDiff / 1000 / 60))
          if (minutesOverdue === 0) {
            showNotification('Todo締切を過ぎました', {
              body: todo.title,
              tag: `todo-${todo.id}-overdue`,
            })
          }
        }
      })
    }

    // Initial check
    checkNotifications()

    // Check every minute
    const interval = setInterval(checkNotifications, 60000)

    return () => clearInterval(interval)
  }, [events, todos, enabled, permission, showNotification])
}
