'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get email from URL params or session
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  const handleResendEmail = async () => {
    if (!email) {
      setResendError('メールアドレスが見つかりません')
      return
    }

    setResending(true)
    setResendError(null)
    setResendSuccess(false)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      setResendError(error.message)
      setResending(false)
    } else {
      setResendSuccess(true)
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            登録後メール認証が必要です！
          </h2>
          <p className="mt-4 text-sm text-gray-600">
            ご登録いただいたメールアドレスに確認メールを送信しました。
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-lg">
            <p className="text-sm font-medium mb-2">次のステップ:</p>
            <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
              <li>メールボックスを確認してください</li>
              <li>確認メール内のリンクをクリックしてください</li>
              <li>メール認証完了後、ログインしてください</li>
            </ol>
          </div>

          {email && (
            <div className="text-sm text-gray-600 text-center">
              送信先: <span className="font-medium text-gray-900">{email}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              確認メールを再送信しました
            </div>
          )}

          {resendError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {resendError}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              メールが届いていない場合は、迷惑メールフォルダもご確認ください。
            </p>

            {email && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending || resendSuccess}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {resending ? '送信中...' : '確認メールを再送信'}
              </button>
            )}

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ログインページに戻る
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
