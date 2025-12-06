'use client'

import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Todo = Database['public']['Tables']['todos']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface MonthlyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  todos: Todo[]
  colors: Color[]
  categories: Category[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

export default function MonthlyCalendar({
  currentDate,
  events,
  todos,
  colors,
  categories,
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

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return null
    const category = categories.find((c) => c.id === categoryId)
    if (!category || !category.color_id) return null
    return getColorById(category.color_id)
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
            className={`p-1.5 sm:p-3 text-center text-xs sm:text-sm font-semibold ${
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
            return <div key={`empty-${index}`} className="border border-gray-200 bg-gray-50 min-h-[60px] sm:min-h-[120px]" />
          }

          const dayEvents = getEventsForDate(date)
          const dayTodos = getTodosForDate(date)
          const today = isToday(date)
          const dayOfWeek = date.getDay()
          const totalItems = dayEvents.length + dayTodos.length

          return (
            <div
              key={date.toISOString()}
              className={`border border-gray-200 p-1 sm:p-2 min-h-[60px] sm:min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${
                today ? 'bg-blue-50' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div
                className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
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
              <div className="space-y-0.5 sm:space-y-1">
                {/* Events */}
                {dayEvents.slice(0, 2).map((event, eventIndex) => {
                  const color = getColorById(event.color_id)
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                        eventIndex > 0 ? 'hidden sm:block' : ''
                      }`}
                      style={{
                        backgroundColor: color?.hex_code + '30' || '#e5e7eb',
                        borderLeft: `2px solid ${color?.hex_code || '#9ca3af'}`,
                      }}
                      title={event.title}
                    >
                      <span className="hidden sm:inline">
                        {new Date(event.start_date).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                      </span>
                      {event.title}
                    </div>
                  )
                })}

                {/* Todos */}
                {dayTodos.slice(0, 2).map((todo, todoIndex) => {
                  const categoryColor = getCategoryColor(todo.category_id)
                  return (
                    <div
                      key={`todo-${todo.id}`}
                      className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate ${
                        todoIndex > 0 ? 'hidden sm:block' : ''
                      }`}
                      style={{
                        backgroundColor: categoryColor?.hex_code ? categoryColor.hex_code + '20' : '#fef3c7',
                        borderLeft: `2px solid ${categoryColor?.hex_code || '#f97316'}`,
                      }}
                      title={`Todo: ${todo.title}`}
                    >
                      <span className="font-semibold text-[10px]">✓</span> {todo.title}
                      {!todo.is_completed && (
                        <span className="ml-0.5 sm:ml-1 text-orange-600 text-[10px]">⚠</span>
                      )}
                    </div>
                  )
                })}

                {totalItems > 2 && (
                  <div className="text-[10px] sm:text-xs text-gray-500 pl-0.5 sm:pl-1">
                    +{totalItems - 2}
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
