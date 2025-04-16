// lib/admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create supabase client with service role for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)