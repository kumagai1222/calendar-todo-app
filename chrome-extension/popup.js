// ポップアップのロジック

const appUrlInput = document.getElementById('appUrl')
const syncButton = document.getElementById('syncButton')
const buttonText = document.getElementById('buttonText')
const statusDiv = document.getElementById('status')
const assignmentsList = document.getElementById('assignmentsList')

// 保存されたURLを読み込み
chrome.storage.sync.get(['appUrl'], (result) => {
  if (result.appUrl) {
    appUrlInput.value = result.appUrl
  } else {
    // デフォルトURL
    appUrlInput.value = 'http://localhost:8081'
  }
})

// URLを保存
appUrlInput.addEventListener('change', () => {
  chrome.storage.sync.set({ appUrl: appUrlInput.value })
})

// 同期ボタンのクリックイベント
syncButton.addEventListener('click', async () => {
  let appUrl = appUrlInput.value.trim()

  if (!appUrl) {
    showStatus('error', 'カレンダーアプリのURLを入力してください')
    return
  }

  // URLから/dashboard などのパスを削除（ベースURLのみにする）
  try {
    const url = new URL(appUrl)
    appUrl = `${url.protocol}//${url.host}`
  } catch (e) {
    // URLが無効な場合はそのまま使用
  }

  // 現在のタブがKLMSページかチェック
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab.url || !tab.url.includes('lms.keio.jp')) {
    showStatus('error', 'KLMSのページで実行してください')
    return
  }

  try {
    setLoading(true)
    showStatus('info', 'KLMSから課題を抽出中...')

    // Content scriptに課題抽出を依頼
    let response
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractAssignments'
      })
    } catch (error) {
      // Content scriptが読み込まれていない場合、手動で注入
      if (error.message.includes('Could not establish connection')) {
        showStatus('info', 'スクリプトを読み込んでいます...')

        // Content scriptを注入
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        })

        // 少し待ってから再試行
        await new Promise(resolve => setTimeout(resolve, 500))

        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'extractAssignments'
        })
      } else {
        throw error
      }
    }

    if (!response || !response.success) {
      throw new Error(response?.error || '課題の抽出に失敗しました')
    }

    const assignments = response.assignments

    if (assignments.length === 0) {
      showStatus('info', '課題が見つかりませんでした')
      setLoading(false)
      return
    }

    // 抽出した課題を表示
    displayAssignments(assignments)
    showStatus('info', `${assignments.length}件の課題を抽出しました。カレンダーアプリに送信中...`)

    // カレンダーアプリに送信
    const syncResponse = await fetch(`${appUrl}/api/klms-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ assignments })
    })

    if (!syncResponse.ok) {
      let errorData
      try {
        errorData = await syncResponse.json()
      } catch (e) {
        throw new Error(`サーバーエラー (${syncResponse.status}): ${syncResponse.statusText}`)
      }
      throw new Error(errorData.error || 'カレンダーアプリへの送信に失敗しました')
    }

    let result
    try {
      result = await syncResponse.json()
    } catch (e) {
      throw new Error('サーバーからの応答が無効です: ' + e.message)
    }

    if (result.success) {
      const message = [
        `✅ 同期完了！`,
        `追加: ${result.results.added}件`,
        `スキップ: ${result.results.skipped}件`,
        result.results.errors.length > 0 ? `エラー: ${result.results.errors.length}件` : ''
      ].filter(Boolean).join(' / ')

      showStatus('success', message)
    } else {
      throw new Error('同期に失敗しました')
    }

  } catch (error) {
    console.error('Sync error:', error)
    showStatus('error', `エラー: ${error.message}`)
  } finally {
    setLoading(false)
  }
})

function setLoading(isLoading) {
  syncButton.disabled = isLoading

  if (isLoading) {
    buttonText.innerHTML = '<span class="loading"></span>同期中...'
  } else {
    buttonText.textContent = '課題を同期'
  }
}

function showStatus(type, message) {
  statusDiv.className = `status ${type}`
  statusDiv.textContent = message
  statusDiv.style.display = 'block'
}

function displayAssignments(assignments) {
  assignmentsList.innerHTML = ''
  assignmentsList.style.display = 'block'

  assignments.forEach(assignment => {
    const item = document.createElement('div')
    item.className = 'assignment-item'

    const title = document.createElement('div')
    title.className = 'assignment-title'
    title.textContent = assignment.title

    const deadline = document.createElement('div')
    deadline.className = 'assignment-deadline'
    deadline.textContent = `期限: ${new Date(assignment.deadline).toLocaleString('ja-JP')}`

    item.appendChild(title)
    item.appendChild(deadline)
    assignmentsList.appendChild(item)
  })
}
