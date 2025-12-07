import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default function Login({ searchParams }: { searchParams: { message: string } }) {
  // 1. Server Action: Sign In
  const signIn = async (formData: FormData) => {
    'use server'; // <--- This directive is required for server actions

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect('/login?message=Could not authenticate user')
    }

    return redirect('/')
  }

  // 2. Server Action: Sign Up
  const signUp = async (formData: FormData) => {
    'use server';

    const origin = (await headers()).get('origin');
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Redirects to our callback route after email click
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      return redirect('/login?message=Could not create account');
    }

    return redirect('/login?message=Check your email to continue sign in process');
  };
}