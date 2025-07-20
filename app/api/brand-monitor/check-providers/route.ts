import { NextRequest, NextResponse } from 'next/server';
import { getConfiguredProviders } from '@/lib/provider-config';
import { handleApiError } from '@/lib/api-errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // TODO: Re-enable authentication after testing

    const configuredProviders = getConfiguredProviders();
    const providers = configuredProviders.map(p => p.name);
    
    if (providers.length === 0) {
      return NextResponse.json({ 
        providers: [], 
        error: 'No AI providers configured. Please set at least one API key.' 
      });
    }
    
    return NextResponse.json({ providers });

  } catch (error) {
    return handleApiError(error);
  }
}