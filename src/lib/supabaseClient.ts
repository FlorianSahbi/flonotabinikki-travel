import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL_V2!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_V2!
)
