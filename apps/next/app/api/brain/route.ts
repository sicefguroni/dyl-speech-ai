import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const NoteSchema = z.object({
  summary: z.string().describe("A concise summary of the content"),
  action_items: z.array(z.string()).describe("List of tasks or follow-ups mentioned"),
  tags: z.array(z.string()).describe("3-5 keywords for categorization"),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe("The sentiment of the content"),
});

export async function POST(req: Request) {
  try {
    // 1. Security Check: Is the user logged in?
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, {status: 401});
    }

    // 2. Parse the request body / Input
    const { audioBase64 } = await req.json();
    
    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audio data' }, {status: 400});
    }

    // 3. The Brain Login: Call Gemini API
    // We use generateObject to force structured JSON output
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: NoteSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Listen to this audio note. Extract the summary, sentiment, action items or tasks, and tags.'},
            { type: 'audio', data: audioBase64, mimeType: 'audio/mp4' }
          ]
        }
      ]
    })

    // 4. Persistence: Save to Supabase
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        content_raw: '(Audio Note)', // Placeholder for audio transcription
        summary: object.summary,
        action_items: object.action_items,
        tags: object.tags,
        sentiment: object.sentiment,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database Error:', error);
      throw new Error('Failed to save note');
    }

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('❌ AI Processing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, {status: 500});
  }
}