import { NextRequest, NextResponse } from 'next/server';
// TODO: Re-enable these imports for proper functionality with Supabase auth
// import { auth } from '@/lib/auth'; 
// import { db } from '@/lib/db';
// import { messageFeedback, messages } from '@/lib/db/schema';
// import { and, eq } from 'drizzle-orm';

// POST /api/chat/feedback - Submit feedback for a message
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable Supabase authentication
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });

    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Re-enable proper feedback functionality with Supabase auth and database
    const { messageId, helpful, rating, feedback } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Temporary stub response - replace with real functionality later
    return NextResponse.json({ 
      success: true,
      messageId,
      feedback: {
        helpful,
        rating,
        feedback,
        timestamp: new Date().toISOString()
      }
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    console.error('Feedback POST error:', _error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}