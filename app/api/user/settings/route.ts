import { NextRequest, NextResponse } from 'next/server';
// TODO: Re-enable Supabase auth and proper user settings functionality
// import { auth } from '@/lib/auth';
// import { db } from '@/lib/db';
// import { userSettings } from '@/lib/db/schema';
// import { eq } from 'drizzle-orm';
// import { handleApiError, AuthenticationError, ValidationError } from '@/lib/api-errors';

// GET /api/user/settings - Get user settings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // TODO: Re-enable proper user settings fetching with Supabase auth
    return NextResponse.json({
      theme: 'light',
      notifications: true,
      language: 'en'
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

// PUT /api/user/settings - Update user settings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest) {
  try {
    // TODO: Re-enable proper user settings updates with Supabase auth
    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// PATCH /api/user/settings - Partially update user settings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PATCH(_request: NextRequest) {
  try {
    // TODO: Re-enable proper user settings partial updates with Supabase auth
    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to patch settings' }, { status: 500 });
  }
}