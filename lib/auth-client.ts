import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Types
interface ClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
}

declare global {
  interface Window {
    __supabaseConfig?: ClientConfig;
  }
}

// Lazy initialization to prevent build-time errors
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let configPromise: Promise<ClientConfig | null> | null = null;
let serverConfigAttempted = false;

// Fetch client configuration from server when env vars not available at build time
async function fetchClientConfig(): Promise<ClientConfig | null> {
  if (configPromise) return configPromise;
  
  console.log('🔍 Attempting to fetch client config from /api/client-config...');
  
  // Use absolute URL in production to avoid relative path issues
  const baseUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
  const configUrl = `${baseUrl}/api/client-config`;
  console.log('Fetching from absolute URL:', configUrl);
  
  configPromise = fetch(configUrl)
    .then(res => {
      console.log('📡 Fetch response received:', res.status, res.statusText);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then((config: ClientConfig) => {
      console.log('✅ Successfully fetched Supabase config from server:', {
        hasSupabaseUrl: !!config.supabaseUrl,
        hasSupabaseKey: !!config.supabaseAnonKey,
        appUrl: config.appUrl
      });
      return config;
    })
    .catch(error => {
      console.error('❌ Failed to fetch client config:', error);
      console.error('Full error details:', error.message, error.stack);
      return null;
    });
  
  return configPromise;
}

function getSupabase() {
  if (!supabaseInstance) {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // If environment variables aren't embedded in client bundle, try server endpoint
    if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey) && !serverConfigAttempted) {
      console.warn('Environment variables not embedded in client bundle, attempting server fetch...');
      serverConfigAttempted = true;
      
      // Trigger async fetch but don't wait for it - store result for next call
      fetchClientConfig().then(config => {
        if (config) {
          console.log('Server config fetched, storing for next initialization...');
          window.__supabaseConfig = config;
          supabaseInstance = null; // Reset to trigger re-initialization with new config
        }
      });
      
      return null; // Return null now, will work on next call after fetch completes
    }
    
    // Check for previously fetched config
    if (typeof window !== 'undefined' && window.__supabaseConfig && (!supabaseUrl || !supabaseAnonKey)) {
      const config = window.__supabaseConfig;
      console.log('Using server-fetched configuration');
      supabaseUrl = config.supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey;
    }
    
    // During client-side hydration, if still missing
    if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
      console.warn('Supabase environment variables not yet available during client hydration. Waiting...');
      setTimeout(() => {
        supabaseInstance = null; // Reset to retry
      }, 100);
      return null;
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }
    
    console.log('Initializing Supabase with URL:', supabaseUrl.substring(0, 30) + '...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Create a mock client structure for hydration
const createMockClient = () => ({
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    updateUser: () => Promise.resolve({ data: null, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
});

// Check if we're in browser and add hydration logging
if (typeof window !== 'undefined') {
  // Wait for hydration to complete and log status
  setTimeout(() => {
    console.log('Client hydration complete, checking environment variables...');
    
    // Test that environment variables are actually available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL is available after hydration');
    } else {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL still not available after hydration');
    }
  }, 1000);
}

// Create a simple getter that returns the client or mock
function getSupabaseClient() {
  const client = getSupabase();
  
  if (client) {
    return client;
  }
  
  // Return mock during hydration
  console.log('Using mock Supabase client during initialization...');
  return createMockClient() as unknown as ReturnType<typeof createClient>;
}

// Export the client - much simpler approach
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof typeof client];
  }
});

// Hook to manage session state
export function useSession() {
  const [data, setData] = useState<{ user: { id: string; email?: string; name?: string }; session: object } | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Map Supabase user structure to match Better Auth structure
        const compatibleUser = {
          ...session.user,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
        }
        setData({ user: compatibleUser, session })
      } else {
        setData(null)
      }
      setIsPending(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          // Map Supabase user structure to match Better Auth structure
          const compatibleUser = {
            ...session.user,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
          }
          setData({ user: compatibleUser, session })
        } else {
          setData(null)
        }
        setIsPending(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { data, isPending }
}

// Sign in function
export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  }
}

// Sign up function
export const signUp = {
  email: async ({ email, password, name }: { email: string; password: string; name: string }) => {
    // Use deployed URL for email confirmation redirects
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name,
        }
      }
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  }
}

// Password reset functions
export const resetPassword = {
  // Request password reset email
  request: async (email: string) => {
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      throw error
    }

    return { success: true }
  },
  
  // Update password with reset token
  update: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw error
    }

    return { success: true }
  }
}

// Sign out function
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
  // Force page reload to clear any cached state
  window.location.href = '/'
}