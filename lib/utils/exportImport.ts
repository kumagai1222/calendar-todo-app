import { Database } from '@/lib/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Todo = Database['public']['Tables']['todos']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export interface ExportData {
  version: string
  exportDate: string
  events: CalendarEvent[]
  todos: Todo[]
  colors: Color[]
  categories: Category[]
}

// Export data as JSON
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

// Export events to iCalendar format
export function exportToICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar & Todo App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  events.forEach((event) => {
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}`)
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
    lines.push(`DTSTART:${formatICSDate(startDate)}`)
    lines.push(`DTEND:${formatICSDate(endDate)}`)
    lines.push(`SUMMARY:${escapeICSText(event.title)}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`)
    }

    const eventAny = event as any
    if (eventAny.is_recurring && eventAny.recurrence_type && eventAny.recurrence_interval) {
      const freq = eventAny.recurrence_type.toUpperCase()
      const interval = eventAny.recurrence_interval
      let rrule = `FREQ=${freq};INTERVAL=${interval}`

      if (eventAny.recurrence_end_date) {
        const endDate = new Date(eventAny.recurrence_end_date)
        rrule += `;UNTIL=${formatICSDate(endDate)}`
      }

      lines.push(`RRULE:${rrule}`)
    }

    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// Export todos to CSV format
export function exportTodosToCSV(todos: Todo[]): string {
  const headers = ['タイトル', '説明', '優先度', '締切', '完了状態', 'カテゴリーID', '作成日']
  const rows = [headers.join(',')]

  todos.forEach((todo) => {
    const row = [
      escapeCSV(todo.title),
      escapeCSV(todo.description || ''),
      escapeCSV(todo.priority),
      escapeCSV(todo.deadline ? new Date(todo.deadline).toISOString() : ''),
      escapeCSV(todo.is_completed ? '完了' : '未完了'),
      escapeCSV(todo.category_id || ''),
      escapeCSV(new Date(todo.created_at).toISOString()),
    ]
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

// Parse imported JSON data
export function parseImportedJSON(jsonString: string): ExportData | null {
  try {
    const data = JSON.parse(jsonString)

    // Validate required fields
    if (!data.version || !data.events || !data.todos) {
      throw new Error('Invalid data format')
    }

    return data as ExportData
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return null
  }
}

// Parse imported ICS file
export function parseICS(icsContent: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = []
  const lines = icsContent.split(/\r?\n/)

  let currentEvent: Partial<CalendarEvent> | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {}
    } else if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent)
      currentEvent = null
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':')

      switch (key) {
        case 'SUMMARY':
          currentEvent.title = unescapeICSText(value)
          break
        case 'DESCRIPTION':
          currentEvent.description = unescapeICSText(value)
          break
        case 'DTSTART':
          currentEvent.start_date = parseICSDate(value)
          break
        case 'DTEND':
          currentEvent.end_date = parseICSDate(value)
          break
        case 'RRULE':
          parseRRule(value, currentEvent)
          break
      }
    }
  }

  return events
}

// Helper functions
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function parseICSDate(dateString: string): string {
  // Remove timezone indicator if present
  const cleaned = dateString.replace(/[TZ]/g, '')

  const year = cleaned.substring(0, 4)
  const month = cleaned.substring(4, 6)
  const day = cleaned.substring(6, 8)
  const hours = cleaned.substring(8, 10) || '00'
  const minutes = cleaned.substring(10, 12) || '00'
  const seconds = cleaned.substring(12, 14) || '00'

  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`).toISOString()
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function unescapeICSText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function escapeCSV(text: string): string {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function parseRRule(rrule: string, event: Partial<CalendarEvent>): void {
  const parts = rrule.split(';')

  parts.forEach((part) => {
    const [key, value] = part.split('=')

    switch (key) {
      case 'FREQ':
        (event as any).is_recurring = true
        ;(event as any).recurrence_type = value.toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'yearly'
        break
      case 'INTERVAL':
        (event as any).recurrence_interval = parseInt(value, 10)
        break
      case 'UNTIL':
        (event as any).recurrence_end_date = parseICSDate(value)
        break
    }
  })
}

// Download file helper
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Read file helper
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
