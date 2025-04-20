import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 1. Use the standard `Request`, not `NextRequest`
export async function GET(
  request: Request,
  // 2. Type `params` as a Promise of your param object
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // 3. Await the params before using them
  const { id } = await params

  // ...initialize Supabase client, query, etc.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase
    .from('users')
    .select('name, department, designation')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
