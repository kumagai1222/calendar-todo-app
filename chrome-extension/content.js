// KLMSページから課題情報を抽出するスクリプト

function extractAssignments() {
  const assignments = []

  // ダッシュボードの全ての日付セクションを取得
  const dayElements = document.querySelectorAll('[class*="day"]')

  // より汎用的なアプローチ: 日付とその下の課題を探す
  const contentElements = document.querySelectorAll('a[href*="course"], a[href*="assignment"]')

  contentElements.forEach(element => {
    try {
      // 課題のタイトルを取得
      const titleElement = element.querySelector('[class*="title"]') || element
      const title = titleElement.textContent.trim()

      if (!title) return

      // 親要素から日付と期限を探す
      let parent = element.parentElement
      let dateFound = false
      let deadline = null

      // 上位の要素を遡って日付情報を探す
      for (let i = 0; i < 5 && parent; i++) {
        const parentText = parent.textContent

        // 日付のパターンを探す (例: "12月7日", "火曜日, 12月9日")
        const dateMatch = parentText.match(/(\d+)月(\d+)日/)
        if (dateMatch && !dateFound) {
          const month = parseInt(dateMatch[1])
          const day = parseInt(dateMatch[2])
          const year = new Date().getFullYear()

          // 期限時刻を探す (例: "期限：23:00", "期限: 23:59")
          const timeMatch = parentText.match(/期限[：:]\s*(\d+):(\d+)/)

          if (timeMatch) {
            const hour = parseInt(timeMatch[1])
            const minute = parseInt(timeMatch[2])

            deadline = new Date(year, month - 1, day, hour, minute).toISOString()
            dateFound = true
          }
        }

        parent = parent.parentElement
      }

      // 科目コードと科目名を抽出
      let courseCode = ''
      let courseName = ''

      // 科目情報を含む要素を探す (例: "5-23 秋(火3)概念 言語 まちづくり講]|湘南藤沢(K-S11] 課題")
      const courseInfoMatch = title.match(/^([\d-]+)\s+(.+?)\s+課題/)
      if (courseInfoMatch) {
        courseCode = courseInfoMatch[1]
        courseName = courseInfoMatch[2]
      }

      if (deadline) {
        assignments.push({
          title,
          deadline,
          courseCode,
          courseName,
          url: element.href || window.location.href,
        })
      }
    } catch (error) {
      console.error('Error extracting assignment:', error)
    }
  })

  return assignments
}

// より詳細な抽出ロジック
function extractAssignmentsDetailed() {
  const assignments = []
  const currentYear = new Date().getFullYear()

  // 日付セクションを探す
  const dateHeaders = document.querySelectorAll('h2, h3, div[class*="date"], div[class*="day"]')

  dateHeaders.forEach(header => {
    const headerText = header.textContent.trim()

    // 日付のパターンをマッチ (例: "本日, 12月7日", "明日, 12月8日", "火曜日, 12月9日")
    const dateMatch = headerText.match(/(\d+)月(\d+)日/)

    if (dateMatch) {
      const month = parseInt(dateMatch[1])
      const day = parseInt(dateMatch[2])

      // この日付の後に続く課題要素を探す
      let nextElement = header.nextElementSibling

      while (nextElement && !nextElement.textContent.includes('月') && !nextElement.textContent.includes('日')) {
        // 課題のリンクを探す
        const links = nextElement.querySelectorAll('a')

        links.forEach(link => {
          const linkText = link.textContent.trim()

          if (linkText && !linkText.includes('月') && !linkText.includes('日')) {
            // 期限時刻を探す
            const container = link.closest('div[class*="item"], li, tr')
            let timeText = container ? container.textContent : nextElement.textContent

            const timeMatch = timeText.match(/期限[：:]\s*(\d+):(\d+)/)

            if (timeMatch) {
              const hour = parseInt(timeMatch[1])
              const minute = parseInt(timeMatch[2])

              const deadline = new Date(currentYear, month - 1, day, hour, minute).toISOString()

              // 科目情報を抽出
              let courseCode = ''
              let courseName = ''
              const courseMatch = linkText.match(/^([\d-]+)\s+(.+?)(?:\s+課題|$)/)

              if (courseMatch) {
                courseCode = courseMatch[1]
                courseName = courseMatch[2]
              }

              assignments.push({
                title: linkText,
                deadline,
                courseCode,
                courseName,
                url: link.href || window.location.href,
              })
            }
          }
        })

        nextElement = nextElement.nextElementSibling
      }
    }
  })

  return assignments
}

// メッセージリスナー: ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractAssignments') {
    try {
      // 両方の方法で抽出を試みる
      const assignments1 = extractAssignments()
      const assignments2 = extractAssignmentsDetailed()

      // 重複を除去してマージ
      const allAssignments = [...assignments1, ...assignments2]
      const uniqueAssignments = Array.from(
        new Map(allAssignments.map(item => [item.title + item.deadline, item])).values()
      )

      sendResponse({
        success: true,
        assignments: uniqueAssignments,
        count: uniqueAssignments.length
      })
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      })
    }
  }
  return true // 非同期レスポンスを許可
})

// ページ読み込み完了時に自動抽出を実行（オプション）
if (window.location.href.includes('lms.keio.jp') && window.location.href.includes('login_success')) {
  console.log('[KLMS Sync] ダッシュボードページを検出しました')
}
