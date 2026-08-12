import { supabase, getCurrentUserId } from './supabase';

// Generic CRUD with mandatory user scoping
export const dataService = {
  async fetchUserData<T>(
    table: string,
    options?: {
      select?: string;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ): Promise<T[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    let query = supabase
      .from(table)
      .select(options?.select || '*')
      .eq('user_id', userId);

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createUserData<T>(table: string, data: Partial<T>): Promise<T> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from(table)
      .insert([{ ...data, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async updateUserData<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<T> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // Critical: ownership check
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async deleteUserData(table: string, id: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Critical: ownership check

    if (error) throw error;
  }
};