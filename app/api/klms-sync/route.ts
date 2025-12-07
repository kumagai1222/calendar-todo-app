import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { assignments } = await request.json()

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
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
        const { title, deadline, courseCode, courseName } = assignment

        // Check if todo with same title and deadline already exists
        const { data: existingTodo } = await supabase
          .from('todos')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', title)
          .eq('deadline', deadline)
          .single()

        if (existingTodo) {
          results.skipped++
          continue
        }

        // Create description
        const description = [
          courseCode ? `科目: ${courseCode}` : '',
          courseName ? courseName : '',
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
      } catch (error) {
        console.error('Error processing assignment:', error)
        results.errors.push(`Failed to process: ${assignment.title}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('KLMS sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
