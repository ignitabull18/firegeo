import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  AuthenticationError, 
  ValidationError, 
  handleApiError 
} from '@/lib/api-errors';
import { 
  ROLE_USER,
  ROLE_ASSISTANT
} from '@/config/constants';
import { createServerClient } from '@supabase/ssr';

async function getUser(request: NextRequest) {
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Server-side, we don't set cookies in API routes
        },
      },
    }
  );

  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

// POST endpoint to handle chat messages
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    
    const { message, conversationId } = await request.json();
    
    if (!message?.trim()) {
      throw new ValidationError('Message cannot be empty');
    }

    if (message.length > 10000) {
      throw new ValidationError('Message too long. Maximum 10,000 characters allowed.');
    }

    console.log('[Chat] User:', user.id, 'Conversation:', conversationId);
    console.log('[Chat] Message length:', message.length);

    let currentConversation;

    if (conversationId) {
      // Find existing conversation
      const [existingConversation] = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, user.id)
        ))
        .limit(1);
      
      if (!existingConversation) {
        throw new ValidationError('Conversation not found or access denied');
      }
      
      currentConversation = existingConversation;
    } else {
      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      currentConversation = newConversation;
    }

    // Store user message
    await db
      .insert(messages)
      .values({
        conversationId: currentConversation.id,
        userId: user.id,
        role: ROLE_USER,
        content: message,
        createdAt: new Date(),
      })
      .returning();

    // Generate a simple response (you can integrate with your AI service here)
    const responses = [
      "I understand your question. Let me help you with that.",
      "That's a great point! Let me provide some insights on this.",
      "Thanks for asking! Here's what I think about that.",
      "I see what you mean. Let me break this down for you.",
      "That's an interesting question. Here's my perspective on it.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Store AI response
    const [aiMessage] = await db
      .insert(messages)
      .values({
        conversationId: currentConversation.id,
        userId: user.id,
        role: ROLE_ASSISTANT,
        content: randomResponse,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      response: randomResponse,
      conversationId: currentConversation.id,
      messageId: aiMessage.id,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return handleApiError(error);
  }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (conversationId) {
      // Get specific conversation with messages
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, user.id)
        ))
        .limit(1);
      
      if (!conversation) {
        throw new ValidationError('Conversation not found or access denied');
      }
      
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt));
      
      return NextResponse.json({
        ...conversation,
        messages: conversationMessages,
      });
    } else {
      // Get all conversations for user with last message
      const userConversations = await db
        .select({
          id: conversations.id,
          title: conversations.title,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .where(eq(conversations.userId, user.id))
        .orderBy(desc(conversations.updatedAt));

      // Get messages for each conversation
      const conversationsWithMessages = await Promise.all(
        userConversations.map(async (conv) => {
          const conversationMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(desc(messages.createdAt));
          
          return {
            ...conv,
            messages: conversationMessages,
          };
        })
      );

      return NextResponse.json(conversationsWithMessages);
    }
  } catch (error) {
    console.error('Chat GET error:', error);
    return handleApiError(error);
  }
}
