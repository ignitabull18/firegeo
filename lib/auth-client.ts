import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Lazy initialization to prevent build-time errors
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      // Return a mock client that throws helpful errors
      throw new Error('Supabase configuration error: NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables in Coolify.');
    }
    if (!supabaseAnonKey) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
      throw new Error('Supabase configuration error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables in Coolify.');
    }
    
    console.log('Initializing Supabase with URL:', supabaseUrl.substring(0, 30) + '...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Export getter to ensure lazy initialization
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>];
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