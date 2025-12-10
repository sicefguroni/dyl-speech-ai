import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Index() {
  const supabase = await createClient();

  // Check if user is logged in 
  const { data: { user } } = await supabase.auth.getUser();

  // If not, bounce them to login
  if (!user) {
    return redirect('/login');
  }

  const signOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Dyl Dashboard</h1>
      <p className="mb-8 text-lg">Logged in as: {user.email}</p>
      
      <form action={signOut}>
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}