import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth'; // TODO: Re-enable Supabase auth
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, NotFoundError } from '@/lib/api-errors';

// DELETE /api/chat/[conversationId] - Delete a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // TODO: Re-enable Supabase authentication
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });

    // if (!session?.user) {
    //   throw new AuthenticationError('Please log in to manage conversations');
    // }

    const { conversationId } = params;

    // Verify the conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      // TODO: Re-enable user filtering: eq(conversations.userId, session.user.id)
    });

    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    // Delete the conversation (messages will cascade delete)
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));
      // TODO: Re-enable user filtering: eq(conversations.userId, session.user.id)

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}