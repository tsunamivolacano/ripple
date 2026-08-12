export function validateUserData(data: any, userId: string): boolean {
  if (!data || !userId) return false;
  
  // Check if data has user_id and it matches
  if (data.user_id && data.user_id !== userId) {
    console.error('Data user_id mismatch:', data.user_id, 'vs', userId);
    return false;
  }
  
  return true;
}

export function sanitizeUserData<T extends { user_id?: string }>(
  data: T,
  userId: string
): Omit<T, 'user_id'> & { user_id: string } {
  return {
    ...data,
    user_id: userId
  };
}