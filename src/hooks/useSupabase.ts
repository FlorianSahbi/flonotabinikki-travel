'use client'

import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function useSupabase() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient<Database>(url, key)
  }, [])

  return supabase
}
