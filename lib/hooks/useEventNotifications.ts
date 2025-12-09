'use client'

import { useEffect, useRef } from 'react'
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
  const sentNotifications = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || permission !== 'granted') {
      return
    }

    // Check events and todos every minute
    const checkNotifications = () => {
      const now = new Date()
      const nowTime = now.getTime()

      console.log('[Notifications] Checking notifications...', {
        eventsCount: events.length,
        todosCount: todos.length,
        enabled,
        permission,
        time: now.toLocaleString('ja-JP')
      })

      // Check events starting in the next 15 minutes
      events.forEach((event) => {
        const startTime = new Date(event.start_date).getTime()
        const timeDiff = startTime - nowTime
        const minutesUntilStart = Math.floor(timeDiff / 1000 / 60)

        // Notify 15 minutes before
        const notif15Key = `event-${event.id}-15min`
        if (minutesUntilStart <= 15 && minutesUntilStart > 14 && !sentNotifications.current.has(notif15Key)) {
          console.log('[Notifications] Sending 15-min reminder for event:', event.title)
          showNotification('予定のリマインダー', {
            body: `${event.title} が15分後に始まります`,
            tag: notif15Key,
          })
          sentNotifications.current.add(notif15Key)
        }

        // Notify 5 minutes before
        const notif5Key = `event-${event.id}-5min`
        if (minutesUntilStart <= 5 && minutesUntilStart > 4 && !sentNotifications.current.has(notif5Key)) {
          showNotification('予定のリマインダー', {
            body: `${event.title} が5分後に始まります`,
            tag: notif5Key,
          })
          sentNotifications.current.add(notif5Key)
        }

        // Notify when starting
        const notifStartKey = `event-${event.id}-start`
        if (minutesUntilStart <= 0 && minutesUntilStart > -1 && !sentNotifications.current.has(notifStartKey)) {
          showNotification('予定が始まります', {
            body: event.title,
            tag: notifStartKey,
          })
          sentNotifications.current.add(notifStartKey)
        }
      })

      // Check todos with upcoming deadlines
      todos.forEach((todo) => {
        if (!todo.deadline || todo.is_completed) {
          return
        }

        const deadlineTime = new Date(todo.deadline).getTime()
        const timeDiff = deadlineTime - nowTime
        const minutesUntilDeadline = Math.floor(timeDiff / 1000 / 60)
        const hoursUntilDeadline = Math.floor(timeDiff / 1000 / 60 / 60)

        // Notify 1 day before (24 hours = 1440 minutes)
        const notif1DayKey = `todo-${todo.id}-1day`
        if (minutesUntilDeadline <= 1440 && minutesUntilDeadline > 1430 && !sentNotifications.current.has(notif1DayKey)) {
          showNotification('Todo締切のリマインダー', {
            body: `${todo.title} の締切が明日です`,
            tag: notif1DayKey,
          })
          sentNotifications.current.add(notif1DayKey)
        }

        // Notify 1 hour before (60 minutes)
        const notif1HourKey = `todo-${todo.id}-1hour`
        if (minutesUntilDeadline <= 60 && minutesUntilDeadline > 59 && !sentNotifications.current.has(notif1HourKey)) {
          showNotification('Todo締切が近づいています', {
            body: `${todo.title} の締切が1時間後です`,
            tag: notif1HourKey,
          })
          sentNotifications.current.add(notif1HourKey)
        }

        // Notify when overdue
        const notifOverdueKey = `todo-${todo.id}-overdue`
        if (minutesUntilDeadline <= 0 && minutesUntilDeadline > -5 && !sentNotifications.current.has(notifOverdueKey)) {
          showNotification('Todo締切を過ぎました', {
            body: todo.title,
            tag: notifOverdueKey,
          })
          sentNotifications.current.add(notifOverdueKey)
        }
      })
    }

    // Initial check
    checkNotifications()

    // Check every minute
    const interval = setInterval(checkNotifications, 60000)

    return () => clearInterval(interval)
  }, [events, todos, enabled, permission, showNotification])

  // Clean up old notifications from memory every hour
  useEffect(() => {
    const cleanup = setInterval(() => {
      sentNotifications.current.clear()
    }, 3600000) // Clear every hour

    return () => clearInterval(cleanup)
  }, [])
}
