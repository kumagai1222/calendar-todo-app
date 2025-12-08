import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// CORS設定を動的に生成
function getCorsHeaders(origin: string | null) {
  // Chrome拡張機能のオリジンを許可（chrome-extension://で始まる）
  const allowedOrigins = [
    'http://localhost:8081',
    'https://calendar-todo-app-six.vercel.app',
  ]

  // Chrome拡張機能からのリクエストも許可
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.startsWith('chrome-extension://')
  )

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// OPTIONSリクエスト（プリフライト）への対応
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return NextResponse.json({}, { headers: getCorsHeaders(origin) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Parse request body
    const { assignments } = await request.json()

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400, headers: corsHeaders }
      )
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Find or create KLMS category
    let klmsCategory = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'KLMS課題')
      .single()

    if (!klmsCategory.data) {
      // Create KLMS category with a default color
      const { data: defaultColor } = await supabase
        .from('colors')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: 'KLMS課題',
          color_id: defaultColor?.id || null,
        })
        .select('id')
        .single()

      klmsCategory.data = newCategory
    }

    // Process each assignment
    for (const assignment of assignments) {
      try {
        const { title, assignmentName, deadline, courseCode, courseName } = assignment

        // 課題名（assignmentName）を使用、なければtitleを使用
        const displayName = assignmentName || title

        // より厳密な重複チェック：課題名とdeadlineで判定
        // まず、descriptionに「KLMSから自動取得」を含むtodoを検索
        const { data: existingTodos } = await supabase
          .from('todos')
          .select('id, title, description')
          .eq('user_id', user.id)
          .eq('deadline', deadline)
          .ilike('description', '%KLMSから自動取得%')

        // 課題名が含まれているか確認
        const isDuplicate = existingTodos?.some(todo =>
          todo.title.includes(displayName) || todo.description?.includes(displayName)
        )

        if (isDuplicate) {
          results.skipped++
          console.log(`[KLMS Sync] Skipping duplicate: ${displayName}`)
          continue
        }

        // Create description
        const description = [
          courseCode ? `科目コード: ${courseCode}` : '',
          courseName ? `科目名: ${courseName}` : '',
          'KLMSから自動取得',
        ].filter(Boolean).join('\n')

        // Create new todo
        await supabase.from('todos').insert({
          user_id: user.id,
          title,
          description,
          deadline,
          priority: 'medium',
          category_id: klmsCategory.data?.id || null,
          is_completed: false,
        })

        results.added++
        console.log(`[KLMS Sync] Added: ${title}`)
      } catch (error) {
        console.error('Error processing assignment:', error)
        results.errors.push(`Failed to process: ${assignment.title}`)
      }
    }

    return NextResponse.json(
      {
        success: true,
        results,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('KLMS sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
