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

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

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
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Synapse Memory</h1>
            <p className="text-gray-500 mt-1">Second Brain Active • {user.email}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
            Gemini 1.5 Flash Connected
          </div>
        </header>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes?.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              
              {/* Card Header: Sentiment & Date */}
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  note.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  note.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {note.sentiment || 'NEUTRAL'}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Main Content */}
              <h3 className="text-lg font-medium text-gray-800 mb-3 leading-snug">
                {note.summary}
              </h3>
              
              {/* Action Items Section (Only shows if items exist) */}
              {note.action_items && (note.action_items as string[]).length > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 p-3 rounded-lg">
                  <p className="text-xs font-bold text-yellow-800 uppercase mb-2">Action Items</p>
                  <ul className="space-y-1">
                    {(note.action_items as string[]).map((item, i) => (
                      <li key={i} className="text-sm text-yellow-900 flex items-start">
                        <span className="mr-2">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags Footer */}
              <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                {note.tags?.map((tag: string) => (
                  <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {(!notes || notes.length === 0) && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <p className="text-gray-400 mb-2">Your mind is empty.</p>
              <p className="text-sm text-gray-500">Record a voice note on mobile to start.</p>
            </div>
          )}
        </div>
      </div>
      <form action={signOut}>
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}