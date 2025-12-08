// KLMSページから課題情報を抽出するスクリプト

function extractAssignments() {
  const assignments = []
  const currentYear = new Date().getFullYear()

  // 課題リンクを探す（modやassignmentを含むURL）
  const assignmentLinks = document.querySelectorAll('a[href*="/mod/assign/"]')

  console.log('[KLMS Sync] Found assignment links:', assignmentLinks.length)

  assignmentLinks.forEach(link => {
    try {
      // リンクのテキストから課題名を取得（例：「第08回課題」）
      let title = link.textContent.trim()

      // リンクの前後のテキストから科目情報を取得
      const container = link.closest('div, li, tr, td')
      if (!container) return

      const fullText = container.textContent

      // 科目情報を抽出（例：「5-23 秋[火3]飯盛 義徳　まちづくり論」）
      let courseInfo = ''
      const lines = fullText.split('\n').map(l => l.trim()).filter(l => l)

      // 課題名の前の行を科目情報として取得
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(title) && i > 0) {
          courseInfo = lines[i - 1]
          break
        }
      }

      // 期限を探す（複数パターンに対応）
      // 統合パターン: 年は省略可能、期限の位置も柔軟に
      const deadlineMatch = fullText.match(/(?:期限[：:\s]*)?(?:(\d{4})年)?(\d{1,2})月\s*(\d{1,2})日[^\d]*?(?:期限[：:\s]*)?(\d{1,2}):(\d{2})/)

      if (!deadlineMatch) return

      // マッチ結果: [full, year?, month, day, hour, minute]
      const year = deadlineMatch[1] ? parseInt(deadlineMatch[1]) : currentYear
      const month = parseInt(deadlineMatch[2])
      const day = parseInt(deadlineMatch[3])
      const hour = parseInt(deadlineMatch[4])
      const minute = parseInt(deadlineMatch[5])

      const deadline = new Date(year, month - 1, day, hour, minute).toISOString()

      // 科目コードと科目名を抽出
      let courseCode = ''
      let courseName = ''

      if (courseInfo) {
        const courseMatch = courseInfo.match(/^([\d-]+)\s+(.+)/)
        if (courseMatch) {
          courseCode = courseMatch[1]
          courseName = courseMatch[2].replace(/\[.*?\]/g, '').trim()
        }
      }

      // 完全な課題タイトルを作成
      const fullTitle = courseInfo ? `${courseInfo} - ${title}` : title

      assignments.push({
        title: fullTitle,
        assignmentName: title, // 課題名のみ（例：「第08回課題」）
        deadline,
        courseCode,
        courseName,
        url: link.href || window.location.href,
      })
    } catch (error) {
      console.error('Error extracting assignment:', error)
    }
  })

  return assignments
}

// より詳細な抽出ロジック（バックアップ用）
function extractAssignmentsDetailed() {
  const assignments = []
  const currentYear = new Date().getFullYear()

  // 全てのリンクを取得（より広範囲に）
  const allLinks = document.querySelectorAll('a')

  console.log('[KLMS Sync Detailed] Total links found:', allLinks.length)

  allLinks.forEach(link => {
    try {
      const href = link.href

      // KLMSの課題リンクをより柔軟に検出
      if (!href || !href.includes('lms.keio.jp')) return
      if (!href.includes('/mod/') && !href.includes('assign') && !href.includes('view')) return

      const linkText = link.textContent.trim()
      if (!linkText) return

      console.log('[KLMS Sync] Checking link:', linkText.substring(0, 50), href.substring(0, 80))

      // 親コンテナを取得
      const container = link.closest('div, li, tr, article, section')
      if (!container) return

      const containerText = container.textContent

      // 日付と期限を抽出（複数パターンに対応）
      // 統合パターン: 年は省略可能、期限の位置も柔軟に
      const deadlineMatch = containerText.match(/(?:期限[：:\s]*)?(?:(\d{4})年)?(\d{1,2})月\s*(\d{1,2})日[^\d]*?(?:期限[：:\s]*)?(\d{1,2}):(\d{2})/)

      if (!deadlineMatch) {
        console.log('[KLMS Sync] No deadline found in container:', containerText.substring(0, 100))
        return
      }

      console.log('[KLMS Sync] Found deadline:', deadlineMatch[0])

      // マッチ結果: [full, year?, month, day, hour, minute]
      const year = deadlineMatch[1] ? parseInt(deadlineMatch[1]) : currentYear
      const month = parseInt(deadlineMatch[2])
      const day = parseInt(deadlineMatch[3])
      const hour = parseInt(deadlineMatch[4])
      const minute = parseInt(deadlineMatch[5])

      const deadline = new Date(year, month - 1, day, hour, minute).toISOString()

      // コンテナ内のテキストを行に分割
      const lines = containerText.split('\n').map(l => l.trim()).filter(l => l)

      // 科目情報を探す
      let courseInfo = ''
      for (const line of lines) {
        if (line.match(/^[\d-]+\s+/) && !line.includes(linkText)) {
          courseInfo = line
          break
        }
      }

      // 科目コードと科目名を抽出
      let courseCode = ''
      let courseName = ''

      if (courseInfo) {
        const courseMatch = courseInfo.match(/^([\d-]+)\s+(.+)/)
        if (courseMatch) {
          courseCode = courseMatch[1]
          courseName = courseMatch[2].replace(/\[.*?\]/g, '').trim()
        }
      }

      const fullTitle = courseInfo ? `${courseInfo} - ${linkText}` : linkText

      assignments.push({
        title: fullTitle,
        assignmentName: linkText,
        deadline,
        courseCode,
        courseName,
        url: href,
      })
    } catch (error) {
      console.error('Error in detailed extraction:', error)
    }
  })

  return assignments
}

// メッセージリスナー: ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractAssignments') {
    try {
      console.log('[KLMS Sync] Starting extraction...')
      console.log('[KLMS Sync] Current URL:', window.location.href)
      console.log('[KLMS Sync] Page title:', document.title)

      // 両方の方法で抽出を試みる
      const assignments1 = extractAssignments()
      const assignments2 = extractAssignmentsDetailed()

      console.log('[KLMS Sync] Method 1 found:', assignments1.length)
      console.log('[KLMS Sync] Method 2 found:', assignments2.length)

      // 重複を除去してマージ（assignmentNameとdeadlineで判定）
      const allAssignments = [...assignments1, ...assignments2]
      const uniqueAssignments = Array.from(
        new Map(
          allAssignments.map(item => {
            // 課題名と期限の組み合わせをキーにする
            const key = (item.assignmentName || item.title) + '|' + item.deadline
            return [key, item]
          })
        ).values()
      )

      console.log('[KLMS Sync] Total unique assignments:', uniqueAssignments.length)
      console.log('[KLMS Sync] Extracted assignments:', uniqueAssignments)

      sendResponse({
        success: true,
        assignments: uniqueAssignments,
        count: uniqueAssignments.length
      })
    } catch (error) {
      console.error('[KLMS Sync] Extraction error:', error)
      sendResponse({
        success: false,
        error: error.message
      })
    }
  }
  return true // 非同期レスポンスを許可
})

// ページ読み込み完了時に自動抽出を実行（オプション）
if (window.location.href.includes('lms.keio.jp')) {
  console.log('[KLMS Sync] KLMSページを検出しました:', window.location.href)
}
