import { Dispatch, SetStateAction } from 'react';
import { EvidenceEntry, StudyLog } from '@/types/ripple';
import { showSuccess } from '@/utils/toast';
import { logUserActivity } from '@/services/loggerService';
import { UserAccount } from '../useRippleAuth';

export function useEvidenceAndStudyData(
  currentUser: UserAccount | null,
  setEvidenceEntries: Dispatch<SetStateAction<EvidenceEntry[]>>,
  studyLogs: StudyLog[],
  setStudyLogs: Dispatch<SetStateAction<StudyLog[]>>
) {
  const logEvidence = async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    if (!currentUser) return;
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    showSuccess('Outcome logged in Evidence Case File!');

    logUserActivity({
      eventName: 'evidence_case_logged',
      eventType: 'evidence',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: {
        evidenceId: newEntry.id,
        taskTitle: newEntry.taskTitle,
        wasOnTime: newEntry.wasOnTime,
        accuracyRating: newEntry.accuracyRating
      }
    });
  };

  const addStudyLog = async (logData: Omit<StudyLog, 'id' | 'loggedAt'>) => {
    if (!currentUser) return;
    const newLog: StudyLog = {
      ...logData,
      id: `study-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    setStudyLogs((prev) => [newLog, ...prev]);
    showSuccess(`Logged ${newLog.durationMinutes} minutes of study for ${newLog.subject}!`);

    logUserActivity({
      eventName: 'study_session_logged',
      eventType: 'study',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: {
        studyLogId: newLog.id,
        subject: newLog.subject,
        durationMinutes: newLog.durationMinutes,
        source: newLog.source
      }
    });
  };

  const deleteStudyLog = async (id: string) => {
    if (!currentUser) return;
    const logToDelete = studyLogs.find((l) => l.id === id);
    setStudyLogs((prev) => prev.filter((l) => l.id !== id));
    showSuccess('Study entry removed.');

    logUserActivity({
      eventName: 'study_session_deleted',
      eventType: 'study',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { studyLogId: id, subject: logToDelete?.subject }
    });
  };

  return { logEvidence, addStudyLog, deleteStudyLog };
}