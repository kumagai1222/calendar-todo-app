'use client'

import { Database } from '@/lib/types/database.types'
import { getHoliday } from '@/lib/utils/holidays'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface DailyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  colors: Color[]
  onEventClick: (event: CalendarEvent) => void
}

export default function DailyCalendar({
  currentDate,
  events,
  colors,
  onEventClick,
}: DailyCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const HOUR_HEIGHT = 60

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

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  const eventsOverlap = (event1: CalendarEvent, event2: CalendarEvent) => {
    const start1 = new Date(event1.start_date).getTime()
    const end1 = new Date(event1.end_date).getTime()
    const start2 = new Date(event2.start_date).getTime()
    const end2 = new Date(event2.end_date).getTime()
    return start1 < end2 && start2 < end1
  }

  const getEventColumns = (events: CalendarEvent[]) => {
    const columns: CalendarEvent[][] = []
    const eventColumns = new Map<string, number>()

    const sortedEvents = [...events].sort((a, b) => {
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

    sortedEvents.forEach((event) => {
      let columnIndex = 0
      let placed = false

      while (!placed) {
        if (!columns[columnIndex]) {
          columns[columnIndex] = []
        }

        const overlaps = columns[columnIndex].some((existingEvent) =>
          eventsOverlap(event, existingEvent)
        )

        if (!overlaps) {
          columns[columnIndex].push(event)
          eventColumns.set(event.id, columnIndex)
          placed = true
        } else {
          columnIndex++
        }
      }
    })

    return { columns, eventColumns, maxColumns: columns.length }
  }

  const getEventStyle = (event: CalendarEvent, columnIndex: number, maxColumns: number) => {
    const startTime = new Date(event.start_date)
    const endTime = new Date(event.end_date)

    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const endHour = endTime.getHours() + endTime.getMinutes() / 60

    const top = startHour * HOUR_HEIGHT
    const duration = endHour - startHour
    const height = duration * HOUR_HEIGHT

    const width = `${100 / maxColumns}%`
    const left = `${(columnIndex / maxColumns) * 100}%`

    return {
      top: `${top}px`,
      height: `${height}px`,
      width,
      left,
    }
  }

  const getMultiDayEvents = () => {
    return events.filter((event) => {
      const start = new Date(event.start_date)
      const end = new Date(event.end_date)
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

      if (endDay <= startDay) return false

      const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
      return currentDay >= startDay && currentDay <= endDay
    })
  }

  const dayEvents = getDayEvents()
  const multiDayEvents = getMultiDayEvents()
  const holiday = getHoliday(currentDate)

  const { eventColumns, maxColumns } = getEventColumns(dayEvents)

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className={`p-4 border-b ${holiday ? 'bg-red-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <h3 className={`text-lg font-semibold ${holiday ? 'text-red-600' : 'text-gray-900'}`}>
            {currentDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </h3>
          {holiday && (
            <span className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded">
              {holiday.name}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          予定: {dayEvents.length}件
        </p>
      </div>

      {/* Multi-day events section */}
      {multiDayEvents.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            複数日にわたる予定
          </h4>
          <div className="space-y-2">
            {multiDayEvents.map((event) => {
              const color = getColorById(event.color_id)
              const start = new Date(event.start_date)
              const end = new Date(event.end_date)

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={{
                    borderLeft: `4px solid ${color?.hex_code || '#9ca3af'}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      {' 〜 '}
                      {end.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color?.hex_code || '#9ca3af' }}
                  />
                </div>
              )
            })}
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
            {hours.map((hour) => (
              <div
                key={`grid-${hour}`}
                className="absolute w-full border-b border-gray-200"
                style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {dayEvents.map((event) => {
              const color = getColorById(event.color_id)
              const startTime = new Date(event.start_date)
              const endTime = new Date(event.end_date)
              const columnIndex = eventColumns.get(event.id) || 0
              const style = getEventStyle(event, columnIndex, maxColumns)

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="absolute p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
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
