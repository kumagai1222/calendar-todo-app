'use client'

import { useRef } from 'react'
import { Database } from '@/lib/types/database.types'
import { getHoliday } from '@/lib/utils/holidays'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface MonthlyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  colors: Color[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export default function MonthlyCalendar({
  currentDate,
  events,
  colors,
  onEventClick,
  onDateClick,
  onSwipeLeft,
  onSwipeRight,
}: MonthlyCalendarProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Swipe handling
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    // Only trigger if horizontal swipe is dominant and distance > 50px
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Create calendar grid
  const calendarDays: (Date | null)[] = []

  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

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

  const getMultiDayEvents = () => {
    return events.filter((event) => {
      const start = new Date(event.start_date)
      const end = new Date(event.end_date)
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      return endDay > startDay
    })
  }

  const multiDayEvents = getMultiDayEvents()

  return (
    <div
      className="bg-white rounded-lg shadow overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Multi-day events section */}
      {multiDayEvents.length > 0 && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            複数日にわたる予定
          </h3>
          <div className="space-y-2">
            {multiDayEvents.map((event) => {
              const color = getColorById(event.color_id)
              const start = new Date(event.start_date)
              const end = new Date(event.end_date)

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-98"
                  style={{
                    borderLeft: `4px solid ${color?.hex_code || '#9ca3af'}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {event.title}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">
                      {start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      {' 〜 '}
                      {end.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color?.hex_code || '#9ca3af' }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={day}
            className={`p-2 sm:p-3 text-center text-sm sm:text-base font-semibold ${
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
            return <div key={`empty-${index}`} className="border border-gray-200 bg-gray-50 min-h-[80px] sm:min-h-[140px]" />
          }

          const dayEvents = getEventsForDate(date)
          const today = isToday(date)
          const dayOfWeek = date.getDay()
          const maxVisible = 5
          const holiday = getHoliday(date)

          return (
            <div
              key={date.toISOString()}
              className={`border border-gray-200 p-1 sm:p-2 min-h-[80px] sm:min-h-[140px] cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden ${
                today ? 'bg-blue-50' : holiday ? 'bg-red-50' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="flex flex-col gap-0.5 mb-1">
                <div
                  className={`text-sm sm:text-base font-semibold ${
                    today
                      ? 'text-blue-600 font-bold'
                      : holiday || dayOfWeek === 0
                      ? 'text-red-600'
                      : dayOfWeek === 6
                      ? 'text-blue-600'
                      : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </div>
                {holiday && (
                  <div className="text-[9px] sm:text-[10px] text-red-600 font-bold truncate leading-tight" title={holiday.name}>
                    {holiday.name}
                  </div>
                )}
              </div>

              {/* Events for this day */}
              <div className="space-y-0.5 sm:space-y-1">
                {dayEvents.slice(0, maxVisible).map((event) => {
                  const color = getColorById(event.color_id)
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className="text-[10px] sm:text-[11px] px-1.5 py-1 rounded-sm truncate cursor-pointer hover:opacity-90 transition-opacity font-medium shadow-sm"
                      style={{
                        backgroundColor: color?.hex_code || '#94a3b8',
                        color: '#ffffff',
                      }}
                      title={`${new Date(event.start_date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} ${event.title}`}
                    >
                      {event.title}
                    </div>
                  )
                })}

                {dayEvents.length > maxVisible && (
                  <div className="text-[10px] sm:text-[11px] text-gray-600 font-semibold pl-1">
                    +{dayEvents.length - maxVisible}
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
