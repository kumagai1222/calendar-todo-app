'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MonthlyCalendar from './MonthlyCalendar'
import DailyCalendar from './DailyCalendar'
import EventModal from './EventModal'
import ColorManager from './ColorManager'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Todo = Database['public']['Tables']['todos']['Row']

interface CalendarViewProps {
  userId: string
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [filteredColorIds, setFilteredColorIds] = useState<Set<string>>(new Set())
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
    loadTodos()
    loadColors()
  }, [currentDate, viewMode, userId])

  const loadEvents = async () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    console.log('[Calendar] Loading events for user:', userId)
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', startDate.toISOString())
      .lte('start_date', endDate.toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('[Calendar] Error loading events:', error)
    } else {
      console.log('[Calendar] Loaded events:', data?.length, 'events')
      setEvents(data)
    }
  }

  const loadTodos = async () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .not('deadline', 'is', null)
      .gte('deadline', startDate.toISOString())
      .lte('deadline', endDate.toISOString())
      .order('deadline', { ascending: true })

    if (!error && data) {
      setTodos(data)
    }
  }

  const loadColors = async () => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setColors(data)
    }
  }

  const toggleColorFilter = (colorId: string) => {
    const newFiltered = new Set(filteredColorIds)
    if (newFiltered.has(colorId)) {
      newFiltered.delete(colorId)
    } else {
      newFiltered.add(colorId)
    }
    setFilteredColorIds(newFiltered)
  }

  const getFilteredEvents = () => {
    let filtered = events

    // For month view, filter by is_visible
    // For day view, show all events regardless of is_visible
    if (viewMode === 'month') {
      filtered = filtered.filter(e => e.is_visible)
    }

    // Apply color filter if any colors are selected
    if (filteredColorIds.size > 0) {
      filtered = filtered.filter(e => e.color_id && filteredColorIds.has(e.color_id))
    }

    return filtered
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventSave = async () => {
    await loadEvents()
    await loadTodos()
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  const handleColorsUpdate = async () => {
    await loadColors()
    await loadEvents()
    await loadTodos()
  }

  const goToPreviousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
    }
  }

  const goToNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const filteredEvents = getFilteredEvents()

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPeriod}
              className="p-2 rounded hover:bg-gray-100"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              今日
            </button>
            <button
              onClick={goToNextPeriod}
              className="p-2 rounded hover:bg-gray-100"
            >
              →
            </button>
            <h2 className="text-xl font-bold ml-4">
              {viewMode === 'month'
                ? `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`
                : currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                月
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                日
              </button>
            </div>

            <button
              onClick={() => setIsColorManagerOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              カラー管理
            </button>

            <button
              onClick={() => handleDateClick(new Date())}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              予定追加
            </button>
          </div>
        </div>

        {/* Color Filters */}
        {colors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">表示フィルター:</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => toggleColorFilter(color.id)}
                  className={`px-3 py-1 text-sm rounded-full border-2 transition-all ${
                    filteredColorIds.size === 0 || filteredColorIds.has(color.id)
                      ? 'opacity-100'
                      : 'opacity-30'
                  }`}
                  style={{
                    borderColor: color.hex_code,
                    backgroundColor: filteredColorIds.has(color.id) || filteredColorIds.size === 0
                      ? color.hex_code + '20'
                      : 'transparent',
                    color: color.hex_code,
                  }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Display */}
      {viewMode === 'month' ? (
        <MonthlyCalendar
          currentDate={currentDate}
          events={filteredEvents}
          todos={todos}
          colors={colors}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      ) : (
        <DailyCalendar
          currentDate={currentDate}
          events={filteredEvents}
          todos={todos}
          colors={colors}
          onEventClick={handleEventClick}
        />
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          initialDate={selectedDate}
          colors={colors}
          onClose={() => {
            setIsEventModalOpen(false)
            setSelectedEvent(null)
            setSelectedDate(null)
          }}
          onSave={handleEventSave}
        />
      )}

      {/* Color Manager Modal */}
      {isColorManagerOpen && (
        <ColorManager
          colors={colors}
          onClose={() => setIsColorManagerOpen(false)}
          onUpdate={handleColorsUpdate}
        />
      )}
    </div>
  )
}
