import { useState, useCallback } from 'react';
import { StudyLog } from '@/types/ripple';
import { generateUUID } from '@/utils/uuidUtils';
import { syncStudyLogInsert, syncStudyLogDelete } from '@/services/databaseSyncService';
import { showSuccess } from '@/utils/toast';
import { UserAccount } from './useRippleAuth';

export function useRippleStudyLogs(currentUser: UserAccount | null) {
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);

  const addStudyLog = useCallback(async (logData: Omit<StudyLog, 'id' | 'loggedAt'>) => {
    if (!currentUser) return;

    const generatedId = generateUUID();
    const newLog: StudyLog = {
      ...logData,
      id: generatedId,
      loggedAt: new Date().toISOString()
    };

    // Immediate optimistic local update
    setStudyLogs((prev) => [newLog, ...prev]);

    if (!currentUser.isDemo) {
      const dbId = await syncStudyLogInsert(currentUser.id, newLog);
      if (dbId && dbId !== generatedId) {
        setStudyLogs((prev) =>
          prev.map((l) => (l.id === generatedId ? { ...l, id: dbId } : l))
        );
      }
    }
  }, [currentUser]);

  const deleteStudyLog = useCallback(async (id: string) => {
    if (!currentUser) return;
    setStudyLogs((prev) => prev.filter((l) => l.id !== id));
    if (!currentUser.isDemo) {
      await syncStudyLogDelete(currentUser.id, id);
    }
    showSuccess('Study entry removed.');
  }, [currentUser]);

  return {
    studyLogs,
    setStudyLogs,
    addStudyLog,
    deleteStudyLog
  };
}