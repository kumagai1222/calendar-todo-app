'use client'

import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Todo = Database['public']['Tables']['todos']['Row']

interface MonthlyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  todos: Todo[]
  colors: Color[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

export default function MonthlyCalendar({
  currentDate,
  events,
  todos,
  colors,
  onEventClick,
  onDateClick,
}: MonthlyCalendarProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Create calendar grid
  const calendarDays: (Date | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getTodosForDate = (date: Date) => {
    return todos.filter((todo) => {
      if (!todo.deadline) return false
      const deadlineDate = new Date(todo.deadline)
      return (
        deadlineDate.getDate() === date.getDate() &&
        deadlineDate.getMonth() === date.getMonth() &&
        deadlineDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center text-sm font-semibold ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="border border-gray-200 bg-gray-50" />
          }

          const dayEvents = getEventsForDate(date)
          const dayTodos = getTodosForDate(date)
          const today = isToday(date)
          const dayOfWeek = date.getDay()
          const totalItems = dayEvents.length + dayTodos.length

          return (
            <div
              key={date.toISOString()}
              className={`border border-gray-200 p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${
                today ? 'bg-blue-50' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  today
                    ? 'text-blue-600 font-bold'
                    : dayOfWeek === 0
                    ? 'text-red-600'
                    : dayOfWeek === 6
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>

              {/* Events and Todos for this day */}
              <div className="space-y-1">
                {/* Events */}
                {dayEvents.slice(0, 2).map((event) => {
                  const color = getColorById(event.color_id)
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: color?.hex_code + '30' || '#e5e7eb',
                        borderLeft: `3px solid ${color?.hex_code || '#9ca3af'}`,
                      }}
                      title={event.title}
                    >
                      {new Date(event.start_date).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {event.title}
                    </div>
                  )
                })}

                {/* Todos */}
                {dayTodos.slice(0, Math.max(0, 3 - dayEvents.length)).map((todo) => {
                  return (
                    <div
                      key={`todo-${todo.id}`}
                      className="text-xs p-1 rounded truncate bg-orange-50 border-l-3 border-orange-500"
                      style={{
                        borderLeft: '3px solid #f97316',
                      }}
                      title={`Todo: ${todo.title}`}
                    >
                      <span className="font-semibold">✓</span> {todo.title}
                      {!todo.is_completed && (
                        <span className="ml-1 text-orange-600">⚠</span>
                      )}
                    </div>
                  )
                })}

                {totalItems > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{totalItems - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
