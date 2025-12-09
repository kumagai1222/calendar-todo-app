'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/lib/hooks/useNotifications'

interface NotificationSettingsProps {
  onClose: () => void
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { isSupported, permission, requestPermission, showNotification } = useNotifications()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    // Load notification setting from localStorage
    const saved = localStorage.getItem('notificationsEnabled')
    setNotificationsEnabled(saved === 'true')
  }, [])

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Enable notifications - request permission
      const granted = await requestPermission()
      if (granted) {
        setNotificationsEnabled(true)
        localStorage.setItem('notificationsEnabled', 'true')
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false)
      localStorage.setItem('notificationsEnabled', 'false')
    }
  }

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      setTestResult('❌ 通知の許可が必要です')
      return
    }

    try {
      showNotification('🔔 テスト通知', {
        body: '通知機能は正常に動作しています！',
        tag: 'test-notification',
      })
      setTestResult('✅ テスト通知を送信しました')

      // Clear message after 3 seconds
      setTimeout(() => setTestResult(null), 3000)
    } catch (error) {
      setTestResult('❌ 通知の送信に失敗しました')
      console.error('Test notification error:', error)
    }
  }

  const getPermissionStatus = () => {
    if (!isSupported) {
      return 'このブラウザは通知をサポートしていません'
    }

    switch (permission) {
      case 'granted':
        return '通知が許可されています'
      case 'denied':
        return '通知がブロックされています。ブラウザの設定から許可してください'
      default:
        return '通知の許可が必要です'
    }
  }

  const getPermissionColor = () => {
    switch (permission) {
      case 'granted':
        return 'text-green-600'
      case 'denied':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">通知設定</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Notification Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 mt-0.5 ${getPermissionColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${getPermissionColor()}`}>
                    {getPermissionStatus()}
                  </p>
                </div>
              </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">通知を有効にする</h3>
                <p className="text-sm text-gray-500 mt-1">
                  予定とTodoのリマインダーを受け取る
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                disabled={!isSupported || permission === 'denied'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Test Notification Button */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleTestNotification}
                disabled={permission !== 'granted'}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                🔔 テスト通知を送信
              </button>
              {testResult && (
                <p className="mt-2 text-sm text-center text-gray-700">
                  {testResult}
                </p>
              )}
            </div>

            {/* Notification Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">通知タイミング</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>予定の15分前</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>予定の5分前</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>予定開始時</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Todo締切の1日前</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Todo締切の1時間前</span>
                </div>
              </div>
            </div>

            {permission === 'denied' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
                <p className="font-medium mb-1">通知がブロックされています</p>
                <p>ブラウザのアドレスバー左側の鍵アイコンから、通知の許可を有効にしてください。</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
