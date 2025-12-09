import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as ical from 'node-ical'

// CORS設定を動的に生成
function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'http://localhost:8081',
    'https://calendar-todo-app-six.vercel.app',
  ]

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
    const { calendarUrl } = await request.json()

    if (!calendarUrl || typeof calendarUrl !== 'string') {
      return NextResponse.json(
        { error: 'Calendar URL is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate URL
    if (!calendarUrl.includes('lms.keio.jp/feeds/calendars/')) {
      return NextResponse.json(
        { error: 'Invalid KLMS calendar URL' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch ICS file
    const icsResponse = await fetch(calendarUrl)

    if (!icsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch calendar. Please check the URL.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const icsData = await icsResponse.text()

    // Parse ICS file
    const events = ical.parseICS(icsData)

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Find or create KLMS category
    let categoryId: string | null = null

    const klmsCategory = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'KLMS課題')
      .single()

    if (!klmsCategory.data) {
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

      categoryId = newCategory?.id || null
    } else {
      categoryId = klmsCategory.data.id
    }

    // Process each event
    for (const key in events) {
      const event = events[key]

      // Only process VEVENT type (skip VTIMEZONE, etc.)
      if (event.type !== 'VEVENT') continue

      try {
        const title = event.summary || 'Untitled Event'
        const description = event.description || ''
        const start = event.start ? new Date(event.start) : null
        const end = event.end ? new Date(event.end) : null
        const uid = event.uid || key

        // Skip if no valid date
        if (!end) continue

        // Check for duplicates using UID (only if external_id column exists)
        const { data: existingTodos } = await supabase
          .from('todos')
          .select('id, title, deadline')
          .eq('user_id', user.id)
          .eq('title', title)
          .eq('deadline', end.toISOString())

        if (existingTodos && existingTodos.length > 0) {
          results.skipped++
          continue
        }

        // Determine if it's an assignment (課題) or just an event
        const isAssignment = title.includes('課題') ||
                           description.includes('Assignment') ||
                           description.includes('課題')

        // Create new todo
        await supabase.from('todos').insert({
          user_id: user.id,
          title,
          description: `${description}\n\nKLMSカレンダーから自動取得`,
          deadline: end.toISOString(),
          priority: isAssignment ? 'high' : 'medium',
          category_id: categoryId,
          is_completed: false,
        })

        results.added++
        console.log(`[KLMS Calendar Sync] Added: ${title}`)
      } catch (error) {
        console.error('Error processing event:', error)
        results.errors.push(`Failed to process: ${event.summary || 'Unknown'}`)
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
    console.error('KLMS calendar sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders(origin) }
    )
  }
}
