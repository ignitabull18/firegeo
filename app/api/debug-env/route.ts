import { NextResponse } from 'next/server';

export async function GET() {
  // Only show this in development or when debugging
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    return NextResponse.json({ 
      error: 'Debug endpoint only available in development',
      production: true,
      nodeEnv: process.env.NODE_ENV 
    });
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    timestamp: new Date().toISOString()
  });
} 