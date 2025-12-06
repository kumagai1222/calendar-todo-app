'use client'

import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Todo = Database['public']['Tables']['todos']['Row']

interface DailyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  todos: Todo[]
  colors: Color[]
  onEventClick: (event: CalendarEvent) => void
}

export default function DailyCalendar({
  currentDate,
  events,
  todos,
  colors,
  onEventClick,
}: DailyCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const HOUR_HEIGHT = 60 // px per hour

  const getDayEvents = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const getDayTodos = () => {
    return todos.filter((todo) => {
      if (!todo.deadline) return false
      const deadlineDate = new Date(todo.deadline)
      return (
        deadlineDate.getDate() === currentDate.getDate() &&
        deadlineDate.getMonth() === currentDate.getMonth() &&
        deadlineDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  // Calculate position and height for an event
  const getEventStyle = (event: CalendarEvent) => {
    const startTime = new Date(event.start_date)
    const endTime = new Date(event.end_date)

    // Calculate hours and minutes as decimal
    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const endHour = endTime.getHours() + endTime.getMinutes() / 60

    // Position from top (in pixels)
    const top = startHour * HOUR_HEIGHT

    // Duration in hours
    const duration = endHour - startHour
    const height = duration * HOUR_HEIGHT

    return {
      top: `${top}px`,
      height: `${height}px`,
    }
  }

  const dayEvents = getDayEvents()
  const dayTodos = getDayTodos()

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          予定: {dayEvents.length}件 | Todo締切: {dayTodos.length}件
        </p>
      </div>

      {/* Todos for the day */}
      {dayTodos.length > 0 && (
        <div className="p-4 bg-orange-50 border-b border-orange-200">
          <h4 className="text-sm font-semibold text-orange-900 mb-2">本日締切のTodo</h4>
          <div className="space-y-2">
            {dayTodos.map((todo) => (
              <div
                key={todo.id}
                className="p-2 bg-white rounded border-l-4 border-orange-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className={`font-medium ${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </span>
                    {!todo.is_completed && (
                      <span className="ml-2 text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                        未完了
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                    todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                {todo.description && (
                  <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid calendar */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div className="flex">
          {/* Time column */}
          <div className="flex-shrink-0 w-20 border-r border-gray-200">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-gray-200 p-2 text-sm text-gray-600 font-medium"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Events column with absolute positioning */}
          <div className="flex-1 relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div
                key={`grid-${hour}`}
                className="absolute w-full border-b border-gray-200"
                style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Event cards with absolute positioning */}
            {dayEvents.map((event) => {
              const color = getColorById(event.color_id)
              const startTime = new Date(event.start_date)
              const endTime = new Date(event.end_date)
              const style = getEventStyle(event)

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="absolute left-1 right-1 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                  style={{
                    ...style,
                    backgroundColor: color?.hex_code + '20' || '#e5e7eb',
                    borderLeft: `4px solid ${color?.hex_code || '#9ca3af'}`,
                    zIndex: 10,
                  }}
                >
                  <div className="text-xs font-semibold text-gray-900 truncate">
                    {startTime.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {event.title}
                  </div>
                  {parseFloat(style.height) > 40 && event.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {parseFloat(style.height) > 30 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {endTime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
