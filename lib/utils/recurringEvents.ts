import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface RecurringEventConfig {
  startDate: Date
  endDate: Date
  recurrenceType: RecurrenceType
  recurrenceEndDate?: Date
  recurrenceInterval: number
}

export function generateRecurringDates(config: RecurringEventConfig): Date[] {
  const { startDate, recurrenceType, recurrenceEndDate, recurrenceInterval } = config
  const dates: Date[] = []
  const maxOccurrences = 365 // Maximum number of occurrences to generate

  let currentDate = new Date(startDate)
  const endLimit = recurrenceEndDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year default

  let count = 0
  while (currentDate <= endLimit && count < maxOccurrences) {
    dates.push(new Date(currentDate))
    count++

    // Calculate next occurrence
    switch (recurrenceType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurrenceInterval)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * recurrenceInterval))
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurrenceInterval)
        break
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + recurrenceInterval)
        break
    }
  }

  return dates
}

export function getRecurrenceLabel(type: RecurrenceType, interval: number): string {
  const intervalText = interval > 1 ? `${interval}` : ''

  switch (type) {
    case 'daily':
      return interval > 1 ? `${interval}日ごと` : '毎日'
    case 'weekly':
      return interval > 1 ? `${interval}週間ごと` : '毎週'
    case 'monthly':
      return interval > 1 ? `${interval}ヶ月ごと` : '毎月'
    case 'yearly':
      return interval > 1 ? `${interval}年ごと` : '毎年'
    default:
      return '繰り返しなし'
  }
}

export function calculateEventDuration(startDate: Date, endDate: Date): number {
  return endDate.getTime() - startDate.getTime()
}
