import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user to verify admin status
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Fetch all profiles with auth data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch auth users (requires admin privileges)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.warn('Could not fetch auth users:', authError);
        // Fallback to profiles only
        setUsers(profiles || []);
      } else {
        // Merge auth users with profiles
        const mergedUsers = authUsers.users.map(authUser => {
          const profile = profiles?.find(p => p.id === authUser.id);
          return {
            id: authUser.id,
            email: authUser.email || '',
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            role: authUser.role || 'user'
          };
        });
        setUsers(mergedUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();

    // Set up real-time subscription for new users
    const subscription = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchAllUsers()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAllUsers]);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Total Users: {users.length}</p>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Created</th>
            <th>Last Sign In</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.full_name || 'N/A'}</td>
              <td>{user.role}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}