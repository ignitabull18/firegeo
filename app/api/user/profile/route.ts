import { NextRequest, NextResponse } from 'next/server';
// TODO: Re-enable Supabase auth and proper user profile functionality
// import { auth } from '@/lib/auth';
// import { db } from '@/lib/db';
// import { userProfile, userSettings } from '@/lib/db/schema';
// import { eq } from 'drizzle-orm';
// import { handleApiError, AuthenticationError, ValidationError } from '@/lib/api-errors';

// GET /api/user/profile - Get user profile and settings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // TODO: Re-enable proper user profile fetching with Supabase auth
    return NextResponse.json({
      id: 'temp-user',
      name: 'Anonymous User',
      email: 'user@example.com',
      settings: {
        notifications: true,
        theme: 'light'
      }
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user profile
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest) {
  try {
    // TODO: Re-enable proper user profile updates with Supabase auth
    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// PATCH /api/user/profile - Partially update user profile  
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PATCH(_request: NextRequest) {
  try {
    // TODO: Re-enable proper user profile partial updates with Supabase auth
    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to patch profile' }, { status: 500 });
  }
}