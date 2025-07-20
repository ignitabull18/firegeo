import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';

// GET /api/brand-monitor/analyses - Get user's brand analyses
export async function GET(_request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // Return empty array for now
    return NextResponse.json([]);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/brand-monitor/analyses - Save a new brand analysis
export async function POST(_request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // Return success without saving to database
    return NextResponse.json({ 
      success: true, 
      message: 'Analysis saving disabled during testing' 
    });
  } catch (error) {
    return handleApiError(error);
  }
}