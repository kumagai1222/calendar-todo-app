import HolidayJp from '@holiday-jp/holiday_jp'

export interface Holiday {
  date: string
  name: string
  name_en: string
}

/**
 * Check if a given date is a Japanese national holiday
 */
export function isHoliday(date: Date): boolean {
  return HolidayJp.isHoliday(date)
}

/**
 * Get holiday information for a given date
 */
export function getHoliday(date: Date): Holiday | null {
  if (!HolidayJp.isHoliday(date)) return null

  // Use between() to get the holiday info for a single date
  const holidays = HolidayJp.between(date, date)
  if (holidays.length === 0) return null

  const holiday = holidays[0]
  return {
    date: typeof holiday.date === 'string' ? holiday.date : holiday.date.toISOString().split('T')[0],
    name: holiday.name,
    name_en: holiday.name_en || ''
  }
}

/**
 * Get all holidays for a given month
 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  const holidays: Holiday[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const holiday = getHoliday(currentDate)
    if (holiday) {
      holidays.push(holiday)
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return holidays
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}
