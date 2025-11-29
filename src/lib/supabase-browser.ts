import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

declare global {
  var __supabaseClient__: SupabaseClient | undefined
}

/**
 * Creates (or reuses) a browser-only Supabase client.
 * Uses @supabase/ssr for better session handling.
 * PKCE code verifier is automatically stored and managed by the client.
 */
export function createSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase browser client can only be created in the browser.')
  }

  if (!globalThis.__supabaseClient__) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      )
    }

    // createBrowserClient automatically handles PKCE and stores the code verifier
    // The code verifier will be available in cookies for server-side code exchange
    globalThis.__supabaseClient__ = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return globalThis.__supabaseClient__
}


