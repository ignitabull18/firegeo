import { NextResponse } from 'next/server';

export async function GET() {
  // Allow this endpoint in both dev and production for troubleshooting
  const isDev = process.env.NODE_ENV === 'development';
  
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    isDev,
    
    // Environment variable checks
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    
    // Partial values (safe to expose for debugging)
    supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    
    // All process.env keys that start with NEXT_PUBLIC (safe to expose)
    publicEnvVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? 'SET' : 'NOT SET';
        return acc;
      }, {} as Record<string, string>),
    
    // Deployment info
    deploymentUrl: process.env.VERCEL_URL || process.env.URL || 'unknown',
    timestamp: new Date().toISOString(),
  });
} 