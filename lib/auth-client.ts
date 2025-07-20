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
  console.log('🎯 fetchClientConfig() ENTERED - checking if promise exists:', !!configPromise);
  
  if (configPromise) {
    console.log('♻️ Returning existing config promise');
    return configPromise;
  }
  
  console.log('🔍 Creating new fetch request to /api/client-config...');
  
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
    
    // Check for previously fetched config first
    if (typeof window !== 'undefined' && window.__supabaseConfig && (!supabaseUrl || !supabaseAnonKey)) {
      const config = window.__supabaseConfig;
      console.log('✅ Using server-fetched configuration');
      supabaseUrl = config.supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey;
    }
    
    // If environment variables aren't embedded in client bundle, try server endpoint
    console.log('🔬 DEBUGGING CONDITIONS:', {
      isWindow: typeof window !== 'undefined',
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey,
      serverConfigAttempted
    });
    
    if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey) && !serverConfigAttempted) {
      console.warn('🔍 Environment variables not embedded in client bundle, attempting server fetch...');
      serverConfigAttempted = true;
      
      // Immediately trigger the fetch and force a retry after it completes
      console.log('🚀 About to call fetchClientConfig()...');
      console.log('🔧 Calling fetchClientConfig() now...');
      const configPromise = fetchClientConfig();
      console.log('🔧 fetchClientConfig() returned, promise created:', !!configPromise);
      console.log('🔧 Starting promise.then() chain...');
      
      configPromise.then(config => {
        console.log('📦 Promise resolved with config:', !!config);
        if (config) {
          console.log('✅ Server config fetched successfully, storing for use...');
          window.__supabaseConfig = config;
          
          // Force immediate re-initialization with server config
          supabaseInstance = null;
          serverConfigAttempted = false; // Allow retry with new config
          
          // Trigger component re-renders by dispatching a custom event
          window.dispatchEvent(new CustomEvent('supabase-config-ready'));
        } else {
          console.error('❌ Server config fetch failed - config is null');
          // Allow retry after a delay
          setTimeout(() => {
            serverConfigAttempted = false;
          }, 2000);
        }
      }).catch(error => {
        console.error('❌ Server config fetch promise rejected:', error);
        setTimeout(() => {
          serverConfigAttempted = false;
        }, 2000);
      });
      
      return null; // Return null now, will work on next call after fetch completes
    }
    
    // During client-side hydration, if still missing
    if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
      console.warn('⏳ Supabase environment variables not yet available during client hydration. Waiting...');
      setTimeout(() => {
        supabaseInstance = null; // Reset to retry
      }, 100);
      return null;
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing after all attempts');
      throw new Error('Supabase configuration missing');
    }
    
    console.log('🚀 Initializing Supabase with URL:', supabaseUrl.substring(0, 30) + '...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// No more mock client - we'll wait for the real one or throw errors

// Check if we're in browser and add hydration logging
if (typeof window !== 'undefined') {
  // Wait for hydration to complete and check config status
  setTimeout(() => {
    console.log('🔄 Client hydration complete, checking config availability...');
    
    // Check if we have config from either source
    const hasProcessEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasWindowConfig = !!(window.__supabaseConfig?.supabaseUrl);
    
    if (hasProcessEnv) {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL available via process.env');
    } else if (hasWindowConfig) {
      console.log('✅ Supabase config available via server fetch in window.__supabaseConfig');
    } else {
      console.error('❌ No Supabase config available from any source after hydration');
    }
    
    console.log('📊 Config status:', {
      processEnv: hasProcessEnv,
      windowConfig: hasWindowConfig,
      windowConfigKeys: window.__supabaseConfig ? Object.keys(window.__supabaseConfig) : 'undefined'
    });
  }, 1000);
  
  // Listen for server config ready event and force re-initialization
  window.addEventListener('supabase-config-ready', () => {
    console.log('🎉 Supabase config ready event received, forcing re-initialization...');
    supabaseInstance = null; // Force re-initialization
    serverConfigAttempted = false; // Allow checking window.__supabaseConfig again
    console.log('🔄 Reset flags for re-initialization: supabaseInstance=null, serverConfigAttempted=false');
    
    // Immediately try to create the real Supabase client
    console.log('🚀 Proactively creating real Supabase client...');
    const realClient = getSupabase();
    if (realClient) {
      console.log('✅ Real Supabase client created successfully after server config fetch!');
    } else {
      console.error('❌ Failed to create real Supabase client even after server config fetch');
    }
  });
}

// Simple getter - returns real client or null (no more mocks!)
function getSupabaseClient() {
  const client = getSupabase();
  
  if (client) {
    console.log('🎉 Using REAL Supabase client');
    return client;
  }
  
  console.log('⏳ Real Supabase client not ready yet, waiting...');
  
  // Force a retry after a short delay
  setTimeout(() => {
    supabaseInstance = null; // Reset to retry
  }, 100);
  
  return null;
}

// Export the client - Wait for real client or throw error (NO MORE MOCKS!)
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error(`🚨 Supabase client not ready yet! Tried to access: ${String(prop)} - Wait for initialization to complete.`);
    }
    return client[prop as keyof typeof client];
  }
});

// Also provide a direct way to get the client once it's ready
export function waitForSupabaseClient(): Promise<ReturnType<typeof createClient>> {
  return new Promise((resolve, reject) => {
    const client = getSupabaseClient();
    if (client) {
      resolve(client);
      return;
    }
    
    // Wait for the config ready event
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for Supabase client'));
    }, 10000);
    
    window.addEventListener('supabase-config-ready', () => {
      clearTimeout(timeout);
      const client = getSupabaseClient();
      if (client) {
        resolve(client);
      } else {
        reject(new Error('Supabase client still not ready after config event'));
      }
    }, { once: true });
  });
}

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

// Sign in function - now waits for real client
export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    console.log('🔐 signIn.email called with:', { email, passwordLength: password.length });
    
    try {
      // Wait for real Supabase client to be ready
      const client = await waitForSupabaseClient();
      console.log('🔍 Got real Supabase client for login!');
      
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('🔐 signInWithPassword result:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        error: error?.message || 'none' 
      });

      if (error) {
        console.error('🔐 Login error:', error);
        throw error
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('🚨 Failed to get Supabase client for login:', err);
      throw new Error('Authentication system not ready. Please wait a moment and try again.');
    }
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