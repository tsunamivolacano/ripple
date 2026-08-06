const SUPABASE_URL = "https://mbtfxnnnqlbhduqddvmw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInRefiI6Im1idGZ4bm5ucWxiaGR1cWRkdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTExNjUsImV4cCI6MjEwMTU4NzE2NX0.6QmzDqFU4WW3rrau5EPhKJGhT23SVrdkigwZlSV_-c4";

export interface DBUser {
  id: string;
  email: string;
  created_at?: string;
}

export const supabaseApi = {
  async getUserByEmail(email: string): Promise<DBUser | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=*`,
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.length > 0 ? data[0] : null;
    } catch {
      return null;
    }
  },

  async createUser(email: string): Promise<DBUser | null> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (!response.ok) {
        return { id: `usr_${Date.now()}`, email: cleanEmail };
      }
      const data = await response.json();
      return data && data.length > 0 ? data[0] : { id: `usr_${Date.now()}`, email: cleanEmail };
    } catch {
      return { id: `usr_${Date.now()}`, email: email.toLowerCase().trim() };
    }
  }
};