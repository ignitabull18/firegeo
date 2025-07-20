import { NextRequest } from 'next/server';
import { performAnalysis, createSSEMessage, AnalysisResult } from '@/lib/analyze-common';
import { SSEEvent } from '@/lib/types';
import { 
  AuthenticationError, 
  ValidationError, 
  handleApiError 
} from '@/lib/api-errors';
import { createServerClient } from '@supabase/ssr';

async function getUser(request: NextRequest) {
  try {
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll();
            console.log('Available cookies:', cookies.map(c => c.name));
            return cookies;
          },
          setAll(cookiesToSet) {
            // In API routes, we don't need to set cookies but we need this function
            console.log('Cookies to set:', cookiesToSet.length);
          },
        },
      }
    );

    const { data: { user }, error } = await supabaseServer.auth.getUser();
    
    console.log('Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: error?.message 
    });
    
    if (!user) {
      throw new AuthenticationError();
    }
    return user;
  } catch (error) {
    console.log('getUser function error:', error);
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError();
  }
}

export const runtime = 'nodejs'; // Use Node.js runtime for streaming
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await getUser(request);
    
    // Parse request body
    const { company, customPrompts, userSelectedCompetitors, useWebSearch } = await request.json();
    
    // Validate required fields
    if (!company?.name || !company?.url) {
      throw new ValidationError('Company name and URL are required');
    }

    console.log('[Brand Monitor] Starting analysis for:', company.name);

    // Set appropriate headers for SSE
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Start the analysis process
        performAnalysis({
          company,
          customPrompts,
          userSelectedCompetitors,
          useWebSearch,
          sendEvent: async (event: SSEEvent) => {
            const message = createSSEMessage(event);
            controller.enqueue(encoder.encode(message));
          }
        }).then((result: AnalysisResult) => {
          // Send final result
          const message = createSSEMessage({
            type: 'complete',
            stage: 'finalizing',
            data: result,
            timestamp: new Date()
          });
          controller.enqueue(encoder.encode(message));
          controller.close();
        }).catch((error: Error) => {
          console.error('[Brand Monitor] Analysis error:', error);
          const message = createSSEMessage({
            type: 'error',
            stage: 'finalizing',
            data: { 
              error: error instanceof Error ? error.message : 'Analysis failed' 
            },
            timestamp: new Date()
          });
          controller.enqueue(encoder.encode(message));
          controller.close();
        });
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('[Brand Monitor] Unexpected error:', error);
    
    // For streaming endpoints, we need to handle errors differently
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return handleApiError(error);
    }

    // Create an error stream for unexpected errors
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const message = createSSEMessage({
          type: 'error',
          stage: 'initializing',
          data: { 
            error: 'An unexpected error occurred' 
          },
          timestamp: new Date()
        });
        controller.enqueue(encoder.encode(message));
        controller.close();
      }
    });

    return new Response(stream, { headers, status: 500 });
  }
}