// @path: src/features/feed/types.ts
import { Database } from '@/shared/types/supabase'

export type FeedItem =
  Database['public']['Functions']['feed_get_context_items']['Returns'][0]
