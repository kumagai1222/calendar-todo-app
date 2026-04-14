'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'
import { getHoliday } from '@/lib/utils/holidays'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface WeeklyCalendarProps {
  userId: string
}

export default function WeeklyCalendar({ userId }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const supabase = createClient()

  const HOUR_HEIGHT = 50
  const START_HOUR = 6
  const END_HOUR = 22
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

  // Get the Monday of the current week
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day // Monday = 1
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const weekStart = getWeekStart(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  useEffect(() => {
    loadEvents()
    loadColors()
  }, [currentDate, userId])

  const loadEvents = async () => {
    const start = weekDays[0]
    const end = new Date(weekDays[6])
    end.setHours(23, 59, 59)

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', start.toISOString())
      .lte('start_date', end.toISOString())
      .order('start_date', { ascending: true })

    if (!error && data) {
      setEvents(data)
    }
  }

  const loadColors = async () => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setColors(data)
    }
  }

  const getColorById = (colorId: string | null) => {
    if (!colorId) return null
    return colors.find((c) => c.id === colorId)
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const goToPreviousWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const goToNextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const goToThisWeek = () => {
    setCurrentDate(new Date())
  }

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

  // Calculate overlapping events for a day
  const getEventColumns = (dayEvents: CalendarEvent[]) => {
    const columns: CalendarEvent[][] = []
    const eventColumns = new Map<string, number>()

    const sorted = [...dayEvents].sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )

    sorted.forEach((event) => {
      let col = 0
      let placed = false
      while (!placed) {
        if (!columns[col]) columns[col] = []
        const overlaps = columns[col].some((ex) => {
          const s1 = new Date(event.start_date).getTime()
          const e1 = new Date(event.end_date).getTime()
          const s2 = new Date(ex.start_date).getTime()
          const e2 = new Date(ex.end_date).getTime()
          return s1 < e2 && s2 < e1
        })
        if (!overlaps) {
          columns[col].push(event)
          eventColumns.set(event.id, col)
          placed = true
        } else {
          col++
        }
      }
    })

    return { eventColumns, maxColumns: Math.max(columns.length, 1) }
  }

  const weekLabel = (() => {
    const s = weekDays[0]
    const e = weekDays[6]
    if (s.getMonth() === e.getMonth()) {
      return `${s.getFullYear()}年 ${s.getMonth() + 1}月 ${s.getDate()}日 〜 ${e.getDate()}日`
    }
    return `${s.getMonth() + 1}/${s.getDate()} 〜 ${e.getMonth() + 1}/${e.getDate()}`
  })()

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goToPreviousWeek} className="p-2 rounded hover:bg-gray-100">
              ←
            </button>
            <button
              onClick={goToThisWeek}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              今週
            </button>
            <button onClick={goToNextWeek} className="p-2 rounded hover:bg-gray-100">
              →
            </button>
            <h2 className="text-lg sm:text-xl font-bold ml-4">{weekLabel}</h2>
          </div>
        </div>
      </div>

      {/* Weekly timetable */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 sticky top-0 bg-white z-20">
              <div className="p-2 border-r border-gray-200" />
              {weekDays.map((date, i) => {
                const today = isToday(date)
                const dayOfWeek = date.getDay()
                const holiday = getHoliday(date)

                return (
                  <div
                    key={i}
                    className={`p-2 text-center border-r border-gray-200 ${
                      today ? 'bg-blue-50' : holiday ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className={`text-xs font-semibold ${
                      holiday || dayOfWeek === 0 ? 'text-red-600' :
                      dayOfWeek === 6 ? 'text-blue-600' :
                      'text-gray-500'
                    }`}>
                      {dayLabels[i]}
                    </div>
                    <div className={`text-lg font-bold ${
                      today ? 'text-blue-600' :
                      holiday || dayOfWeek === 0 ? 'text-red-600' :
                      dayOfWeek === 6 ? 'text-blue-600' :
                      'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    {holiday && (
                      <div className="text-[9px] text-red-600 font-bold truncate" title={holiday.name}>
                        {holiday.name}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
                {/* Time labels */}
                <div className="relative border-r border-gray-200">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full text-right pr-2 text-xs text-gray-500 font-medium"
                      style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((date, dayIndex) => {
                  const dayEvents = getEventsForDay(date)
                  const { eventColumns, maxColumns } = getEventColumns(dayEvents)
                  const today = isToday(date)

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-r border-gray-200 ${today ? 'bg-blue-50/30' : ''}`}
                    >
                      {/* Hour grid lines */}
                      {hours.map((hour) => (
                        <div
                          key={`grid-${hour}`}
                          className="absolute w-full border-b border-gray-100"
                          style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {/* Events */}
                      {dayEvents.map((event) => {
                        const color = getColorById(event.color_id)
                        const startTime = new Date(event.start_date)
                        const endTime = new Date(event.end_date)

                        const startHour = startTime.getHours() + startTime.getMinutes() / 60
                        const endHour = endTime.getHours() + endTime.getMinutes() / 60

                        // Clamp to visible range
                        const clampedStart = Math.max(startHour, START_HOUR)
                        const clampedEnd = Math.min(endHour, END_HOUR)
                        if (clampedEnd <= clampedStart) return null

                        const top = (clampedStart - START_HOUR) * HOUR_HEIGHT
                        const height = (clampedEnd - clampedStart) * HOUR_HEIGHT
                        const colIndex = eventColumns.get(event.id) || 0
                        const width = `${100 / maxColumns}%`
                        const left = `${(colIndex / maxColumns) * 100}%`

                        return (
                          <div
                            key={event.id}
                            className="absolute rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 20)}px`,
                              width,
                              left,
                              backgroundColor: color?.hex_code || '#94a3b8',
                              zIndex: 10,
                              padding: '2px 4px',
                            }}
                          >
                            <div className="text-[10px] font-bold text-white truncate leading-tight">
                              {event.title}
                            </div>
                            {height > 30 && (
                              <div className="text-[9px] text-white/80 truncate">
                                {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
