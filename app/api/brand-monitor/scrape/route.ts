import { NextRequest, NextResponse } from 'next/server';
import { scrapeCompanyInfo } from '@/lib/scrape-utils';
import { 
  handleApiError, 
  AuthenticationError, 
  ValidationError
} from '@/lib/api-errors';
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
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getUser(request);

    if (!user) {
      throw new AuthenticationError('Please log in to use this feature');
    }

    const { url, maxAge } = await request.json();

    if (!url) {
      throw new ValidationError('Invalid request', {
        url: 'URL is required'
      });
    }
    
    // Ensure URL has protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      throw new ValidationError('Invalid URL format', {
        url: 'Please provide a valid URL'
      });
    }

    console.log('[Brand Monitor Scrape] Processing URL:', normalizedUrl);

    // Scrape the URL for company info
    const scrapedData = await scrapeCompanyInfo(normalizedUrl, maxAge);

    return NextResponse.json({
      success: true,
      data: scrapedData,
      url: normalizedUrl,
    });
  } catch (error) {
    console.error('[Brand Monitor Scrape] API error:', error);
    return handleApiError(error);
  }
}