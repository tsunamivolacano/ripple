import { useEffect, useState, useCallback } from 'react';
import { supabase, getCurrentUserId } from '@/lib/supabase';

export function useUserData<T>(
  table: string,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    filter?: Record<string, any>;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from(table)
        .select(options?.select || '*')
        .eq('user_id', userId); // CRITICAL: Always scope to current user

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false
        });
      }

      const { data: result, error: queryError } = await query;
      if (queryError) throw queryError;

      setData(result || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [table, options?.select, options?.orderBy?.column, options?.orderBy?.ascending, JSON.stringify(options?.filter)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD operations with user isolation
  const create = useCallback(async (newData: Partial<T>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from(table)
        .insert([{ ...newData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      await fetchData();
      return result;
    } catch (err) {
      console.error(`Error creating in ${table}:`, err);
      throw err;
    }
  }, [table, fetchData]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // CRITICAL: Ensure ownership
        .select()
        .single();

      if (error) throw error;
      await fetchData();
      return result;
    } catch (err) {
      console.error(`Error updating in ${table}:`, err);
      throw err;
    }
  }, [table, fetchData]);

  const remove = useCallback(async (id: string) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // CRITICAL: Ensure ownership

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
      throw err;
    }
  }, [table, fetchData]);

  return { data, loading, error, create, update, remove, refetch: fetchData };
}