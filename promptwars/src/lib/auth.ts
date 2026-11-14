import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role?: 'learner' | 'volunteer' | 'ngo' | 'student';
  degree?: string;
  institution?: string;
  target_career_id?: string;
  skills?: string[];
  location?: string;
  bio?: string;
}

export const signUp = async (data: SignUpData) => {
  const { email, password, ...metadata } = data;

  // Use Admin REST API directly (service key allows this from browser)
  // This bypasses email confirmation requirement
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          ...metadata,
          role: metadata.role || "learner",
        },
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      // If admin API fails, fall through to standard signUp
      throw new Error(json.message || json.error || "Admin API failed");
    }

    // Admin user created — now sign in to establish browser session
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) throw signInErr;
    return signInData;

  } catch (adminError) {
    console.warn("Admin signUp failed, falling back to standard signUp:", adminError);
  }

  // Fallback: standard signUp (requires email confirmation disabled in Supabase dashboard)
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...metadata,
        role: metadata.role || "learner",
      },
    },
  });

  if (error) throw error;

  // Try immediate sign-in (works if email confirmation is disabled)
  try {
    await supabase.auth.signInWithPassword({ email, password });
  } catch (_e) {
    // Will need email confirmation
  }

  return authData;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};
