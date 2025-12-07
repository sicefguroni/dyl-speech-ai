import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // if "next" is in params, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Login successful, forward to protected area
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Login failed, redirect to login page with error message
  return NextResponse.redirect(`${origin}/login?message=Auth Error`)
}