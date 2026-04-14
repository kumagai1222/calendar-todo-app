'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MonthlyCalendar from './MonthlyCalendar'
import DailyCalendar from './DailyCalendar'
import EventModal from './EventModal'
import ColorManager from './ColorManager'
import ExportImportModal from './ExportImportModal'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Todo = Database['public']['Tables']['todos']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface CalendarViewProps {
  userId: string
  resetToMonth?: boolean
  onNavigateMonth?: (direction: 'prev' | 'next') => void
}

export default function CalendarView({ userId, resetToMonth }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')

  // Reset to month view when resetToMonth prop changes
  useEffect(() => {
    if (resetToMonth) {
      setViewMode('month')
    }
  }, [resetToMonth])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [filteredColorIds, setFilteredColorIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false)
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
    loadColors()
  }, [currentDate, viewMode, userId])

  const loadEvents = async () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', startDate.toISOString())
      .lte('start_date', endDate.toISOString())
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

    if (filteredColorIds.size > 0) {
      filtered = filtered.filter(e => e.color_id && filteredColorIds.has(e.color_id))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query))
      )
    }

    return filtered
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleAddEvent = () => {
    setSelectedDate(currentDate)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventSave = async () => {
    await loadEvents()
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  const handleColorsUpdate = async () => {
    await loadColors()
    await loadEvents()
  }

  const handleImport = async (data: {
    events?: Partial<CalendarEvent>[]
    todos?: Partial<Todo>[]
    colors?: Color[]
    categories?: Category[]
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      if (data.colors && data.colors.length > 0) {
        const colorsToInsert = data.colors.map((color) => ({
          name: color.name,
          hex_code: color.hex_code,
          user_id: user.id,
        }))
        await supabase.from('colors').insert(colorsToInsert)
      }

      if (data.events && data.events.length > 0) {
        const eventsToInsert = data.events.map((event) => ({
          title: event.title!,
          description: event.description,
          start_date: event.start_date!,
          end_date: event.end_date!,
          color_id: event.color_id,
          is_visible: event.is_visible ?? true,
          is_recurring: (event as any).is_recurring ?? false,
          recurrence_type: (event as any).recurrence_type,
          recurrence_interval: (event as any).recurrence_interval,
          recurrence_end_date: (event as any).recurrence_end_date,
          user_id: user.id,
        }))
        await supabase.from('calendar_events').insert(eventsToInsert)
      }

      await loadEvents()
      await loadColors()
    } catch (error) {
      console.error('Import error:', error)
      throw error
    }
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
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="予定を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

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
              onClick={() => setIsExportImportModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              title="エクスポート/インポート"
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="hidden sm:inline">データ</span>
            </button>

            <button
              onClick={() => setIsColorManagerOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              カラー管理
            </button>

            <button
              onClick={handleAddEvent}
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
            <div className="flex flex-wrap gap-2 items-center">
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
          colors={colors}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onSwipeLeft={goToNextPeriod}
          onSwipeRight={goToPreviousPeriod}
        />
      ) : (
        <DailyCalendar
          currentDate={currentDate}
          events={filteredEvents}
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

      {/* Export/Import Modal */}
      {isExportImportModalOpen && (
        <ExportImportModal
          events={events}
          todos={[]}
          colors={colors}
          categories={[]}
          onClose={() => setIsExportImportModalOpen(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}
