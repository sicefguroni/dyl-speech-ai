import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient as createStandardClient } from '@supabase/supabase-js'; // Renamed for clarity
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const NoteSchema = z.object({
  summary: z.string().describe("A concise summary of the content"),
  action_items: z.array(z.string()).describe("List of tasks or follow-ups mentioned"),
  tags: z.array(z.string()).describe("3-5 keywords for categorization"),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe("The sentiment of the content"),
});

export async function POST(req: Request) {
  try {
    // BUG FIX 1: Use 'let', not 'const', so we can assign it conditionally
    let supabase;
    
    // Check for Authorization header (Mobile Strategy)
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      // BUG FIX 2: Initialize properly with URL/Key when using the standard client
      supabase = createStandardClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: authHeader } },
        }
      );
    } else {
      // Fallback to Cookies (Web Dashboard Strategy)
      supabase = await createServerClient();
    }

    // 3. Authenticate
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      console.error('Auth Error:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid Session' }, { status: 401 });
    }

    // 4. Parse the request body
    const { audioBase64 } = await req.json();
    
    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audio data' }, {status: 400});
    }

    // 5. Determine MimeType (Simple Detection)
    // The log showed 'ftyp3gp4', so let's be safe and use a generic audio type if unsure, 
    // but specific is better. 3gp is common for Low Quality recording presets.
    const is3GP = audioBase64.substring(0, 20).includes('ftyp3gp');
    const mimeType = is3GP ? 'audio/3gpp' : 'audio/mp4'; // More specific than 'audio/mp4'

    // 6. AI Processing
    // Note: Ensure 'gemini-1.5-flash' is the correct model name (2.5 might not exist yet)
    const { object } = await generateObject({
      model: google('gemini-flash-latest'), 
      schema: NoteSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Listen to this audio note. Extract the summary, sentiment, action items or tasks, and tags.'},
            { type: 'file', data: audioBase64, mediaType: mimeType } // FilePart requires 'mediaType', not 'mimeType'
          ]
        }
      ]
    })

    // 6. Persistence
    const { data: note, error: dbError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        content_raw: '(Audio Note)',
        summary: object.summary,
        action_items: object.action_items,
        tags: object.tags,
        sentiment: object.sentiment,
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database Error:', dbError);
      throw new Error('Failed to save note');
    }

    return NextResponse.json({ success: true, note });

  } catch (error: any) {
    console.error('❌ AI Processing Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, {status: 500});
  }
}