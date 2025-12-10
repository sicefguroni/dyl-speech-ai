import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Login({ searchParams }: { readonly searchParams: Promise<{ message: string }> }) {
  const { message } = await searchParams; // this is a promise, so we need to await it // note: learn more about this later
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

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Dyl Login</h1>
      
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <label className="text-md" htmlFor="email">Email</label>
        <input 
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="your@email.com"
          required
        />

        <label className="text-md" htmlFor="password">Password</label>
        <input 
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="password"
          type="password"
          placeholder="********"
          required
        />

        <button
          formAction={signIn}
          className="bg-blue-600 text-white rounded-md px-4 py-2 mb-2 hover:bg-blue-700 transition"
        >
          Sign In
        </button>
        <button 
          formAction={signUp} 
          className="border border-gray-300 rounded-md px-4 py-2 text-foreground mb-2 hover:bg-gray-100 transition"
        >
          Sign Up
        </button>
        
        {message && (
          <p className="mt-4 p-4 bg-red-100 text-red-800 text-center rounded-md">
            {message}
          </p>  
        )}
      </form>
    </div>
  )
}