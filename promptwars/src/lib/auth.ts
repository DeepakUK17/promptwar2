import { supabase } from "@/integrations/supabase/client";

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

  // If email confirmation is disabled in Supabase dashboard,
  // the session is returned immediately — sign in to ensure session exists
  if (authData.session) {
    return authData;
  }

  // Email confirmation is ON — try signing in anyway (works if confirm is disabled)
  try {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!signInErr && signInData.session) {
      return signInData;
    }
  } catch (_e) {
    // ignore
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
