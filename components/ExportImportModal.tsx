'use client'

import { useState } from 'react'
import { Database } from '@/lib/types/database.types'
import {
  exportToJSON,
  exportToICS,
  exportTodosToCSV,
  parseImportedJSON,
  parseICS,
  downloadFile,
  readFile,
  ExportData,
} from '@/lib/utils/exportImport'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Todo = Database['public']['Tables']['todos']['Row']
type Color = Database['public']['Tables']['colors']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface ExportImportModalProps {
  events: CalendarEvent[]
  todos: Todo[]
  colors: Color[]
  categories: Category[]
  onClose: () => void
  onImport: (data: {
    events?: Partial<CalendarEvent>[]
    todos?: Partial<Todo>[]
    colors?: Color[]
    categories?: Category[]
  }) => Promise<void>
}

export default function ExportImportModal({
  events,
  todos,
  colors,
  categories,
  onClose,
  onImport,
}: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportFormat, setExportFormat] = useState<'json' | 'ics' | 'csv'>('json')
  const [importFormat, setImportFormat] = useState<'json' | 'ics'>('json')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = () => {
    try {
      setError(null)
      const timestamp = new Date().toISOString().split('T')[0]

      if (exportFormat === 'json') {
        const data: ExportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          events,
          todos,
          colors,
          categories,
        }
        const jsonContent = exportToJSON(data)
        downloadFile(jsonContent, `calendar-todo-${timestamp}.json`, 'application/json')
        setSuccess('JSONファイルをエクスポートしました')
      } else if (exportFormat === 'ics') {
        const icsContent = exportToICS(events)
        downloadFile(icsContent, `calendar-events-${timestamp}.ics`, 'text/calendar')
        setSuccess('iCalendarファイルをエクスポートしました')
      } else if (exportFormat === 'csv') {
        const csvContent = exportTodosToCSV(todos)
        downloadFile(csvContent, `todos-${timestamp}.csv`, 'text/csv')
        setSuccess('CSVファイルをエクスポートしました')
      }
    } catch (err) {
      setError('エクスポート中にエラーが発生しました')
      console.error('Export error:', err)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const content = await readFile(file)

      if (importFormat === 'json') {
        const data = parseImportedJSON(content)
        if (!data) {
          throw new Error('Invalid JSON format')
        }

        await onImport({
          events: data.events,
          todos: data.todos,
          colors: data.colors,
          categories: data.categories,
        })

        setSuccess(
          `インポート完了: 予定${data.events.length}件、Todo${data.todos.length}件、カラー${data.colors.length}件、カテゴリ${data.categories.length}件`
        )
      } else if (importFormat === 'ics') {
        const parsedEvents = parseICS(content)

        if (parsedEvents.length === 0) {
          throw new Error('No events found in ICS file')
        }

        await onImport({
          events: parsedEvents,
        })

        setSuccess(`インポート完了: 予定${parsedEvents.length}件`)
      }

      // Reset file input
      event.target.value = ''
    } catch (err) {
      setError('インポート中にエラーが発生しました: ' + (err as Error).message)
      console.error('Import error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              エクスポート / インポート
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

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setActiveTab('export')
                setError(null)
                setSuccess(null)
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              エクスポート
            </button>
            <button
              onClick={() => {
                setActiveTab('import')
                setError(null)
                setSuccess(null)
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              インポート
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  エクスポート形式
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'json')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      JSON (すべてのデータ: 予定、Todo、カラー、カテゴリ)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="ics"
                      checked={exportFormat === 'ics'}
                      onChange={(e) => setExportFormat(e.target.value as 'ics')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      iCalendar (.ics) (予定のみ - 他のカレンダーアプリと互換)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'csv')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      CSV (Todoのみ - スプレッドシートで編集可能)
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">エクスポート対象</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {exportFormat === 'json' && (
                    <>
                      <p>• 予定: {events.length}件</p>
                      <p>• Todo: {todos.length}件</p>
                      <p>• カラー: {colors.length}件</p>
                      <p>• カテゴリ: {categories.length}件</p>
                    </>
                  )}
                  {exportFormat === 'ics' && <p>• 予定: {events.length}件</p>}
                  {exportFormat === 'csv' && <p>• Todo: {todos.length}件</p>}
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                ダウンロード
              </button>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  インポート形式
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={importFormat === 'json'}
                      onChange={(e) => setImportFormat(e.target.value as 'json')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      JSON (このアプリからエクスポートしたファイル)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="ics"
                      checked={importFormat === 'ics'}
                      onChange={(e) => setImportFormat(e.target.value as 'ics')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      iCalendar (.ics) (他のカレンダーアプリからエクスポートしたファイル)
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">注意事項</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>インポートしたデータは既存のデータに追加されます</li>
                      <li>重複したデータが作成される可能性があります</li>
                      <li>iCalendar形式の場合、予定のみがインポートされます</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block w-full">
                  <span className="sr-only">ファイルを選択</span>
                  <input
                    type="file"
                    accept={importFormat === 'json' ? '.json' : '.ics'}
                    onChange={handleFileSelect}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  {importFormat === 'json' ? 'JSONファイル (.json)' : 'iCalendarファイル (.ics)'} を選択してください
                </p>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-sm text-gray-600">インポート中...</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
