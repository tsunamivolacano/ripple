declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
    created_at?: string;
  }

  export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  }

  export interface AuthChangeEvent {
    (event: string, session: Session | null): void;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, any>
  ): any;
}