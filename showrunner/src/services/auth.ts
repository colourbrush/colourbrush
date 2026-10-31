/**
 * Identity boundary. Today there is one local user and no sign-in. When you
 * open Showrunner to other people, add a provider (Supabase Auth, Clerk,
 * Sign in with Apple…) that implements this interface; every Node already
 * carries an ownerId, so data is per-user from day one.
 */
export interface User {
  id: string;
  name: string;
  plan: 'local' | 'free' | 'pro';
}

export interface AuthProvider {
  currentUser(): Promise<User>;
}

export class LocalAuth implements AuthProvider {
  async currentUser(): Promise<User> {
    return { id: 'local', name: 'You', plan: 'local' };
  }
}
