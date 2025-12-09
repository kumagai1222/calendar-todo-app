'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Color = Database['public']['Tables']['colors']['Row']

interface EventModalProps {
  event: CalendarEvent | null
  initialDate: Date | null
  colors: Color[]
  onClose: () => void
  onSave: () => void
}

export default function EventModal({
  event,
  initialDate,
  colors,
  onClose,
  onSave,
}: EventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [colorId, setColorId] = useState<string>('')
  const [isVisible, setIsVisible] = useState(true)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      const start = new Date(event.start_date)
      const end = new Date(event.end_date)
      setStartDate(start.toISOString().split('T')[0])
      setStartTime(start.toTimeString().slice(0, 5))
      setEndDate(end.toISOString().split('T')[0])
      setEndTime(end.toTimeString().slice(0, 5))
      setColorId(event.color_id || '')
      setIsVisible(event.is_visible)
      setIsRecurring((event as any).is_recurring || false)
      setRecurrenceType((event as any).recurrence_type || 'weekly')
      setRecurrenceInterval((event as any).recurrence_interval || 1)
      if ((event as any).recurrence_end_date) {
        setRecurrenceEndDate(new Date((event as any).recurrence_end_date).toISOString().split('T')[0])
      }
    } else if (initialDate) {
      const dateStr = initialDate.toISOString().split('T')[0]
      setStartDate(dateStr)
      setEndDate(dateStr)
      setStartTime('09:00')
      setEndTime('10:00')
    }
  }, [event, initialDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      setError('終了時刻は開始時刻より後である必要があります')
      setLoading(false)
      return
    }

    const eventData: any = {
      title,
      description: description || null,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      color_id: colorId || null,
      is_visible: isVisible,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
      recurrence_interval: isRecurring ? recurrenceInterval : null,
      recurrence_end_date: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
    }

    if (event) {
      // Update existing event
      const { error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', event.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        onSave()
      }
    } else {
      // Create new event
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ユーザーが見つかりません')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('calendar_events')
        .insert([{ ...eventData, user_id: user.id }])

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        onSave()
      }
    }
  }

  const handleDelete = async () => {
    if (!event || !confirm('この予定を削除しますか?')) return

    setLoading(true)
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', event.id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {event ? '予定を編集' : '予定を追加'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日 *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始時刻 *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value
                    setStartTime(newStartTime)

                    // Auto-set end time to 1 hour later
                    if (newStartTime) {
                      const [hours, minutes] = newStartTime.split(':').map(Number)
                      const endHour = (hours + 1) % 24
                      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                      setEndTime(endTimeStr)

                      // If end time goes to next day, update end date
                      if (hours + 1 >= 24) {
                        const currentStartDate = new Date(startDate)
                        currentStartDate.setDate(currentStartDate.getDate() + 1)
                        setEndDate(currentStartDate.toISOString().split('T')[0])
                      } else if (startDate && endDate !== startDate && hours + 1 < 24) {
                        // Reset end date to same as start date if it was different
                        setEndDate(startDate)
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日 *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了時刻 *
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カラー
              </label>
              <select
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">カラーなし</option>
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVisible"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isVisible" className="ml-2 text-sm text-gray-700">
                カレンダーに表示する
              </label>
            </div>

            {/* Recurring Event Settings */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
                  繰り返し予定
                </label>
              </div>

              {isRecurring && (
                <div className="space-y-4 ml-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        繰り返しタイプ
                      </label>
                      <select
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">毎日</option>
                        <option value="weekly">毎週</option>
                        <option value="monthly">毎月</option>
                        <option value="yearly">毎年</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        間隔
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      繰り返し終了日（オプション）
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    {recurrenceInterval > 1 ? `${recurrenceInterval}` : ''}
                    {recurrenceType === 'daily' && (recurrenceInterval > 1 ? '日ごと' : '毎日')}
                    {recurrenceType === 'weekly' && (recurrenceInterval > 1 ? '週間ごと' : '毎週')}
                    {recurrenceType === 'monthly' && (recurrenceInterval > 1 ? 'ヶ月ごと' : '毎月')}
                    {recurrenceType === 'yearly' && (recurrenceInterval > 1 ? '年ごと' : '毎年')}
                    に繰り返します
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {event && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
