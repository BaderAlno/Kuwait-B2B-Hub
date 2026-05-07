import { createClient } from '@/utils/supabase/server';
import { User } from './db';

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return profile as User;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireRole(role: string | string[]): Promise<User> {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) throw new Error('Forbidden');
  return user;
}
