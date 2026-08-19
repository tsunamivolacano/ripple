import { useState, useCallback } from 'react';
import { EvidenceEntry } from '@/types/ripple';
import { generateUUID } from '@/utils/uuidUtils';
import { syncEvidenceInsert } from '@/services/databaseSyncService';
import { showSuccess } from '@/utils/toast';
import { UserAccount } from './useRippleAuth';

export function useRippleEvidence(currentUser: UserAccount | null) {
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);

  const logEvidence = useCallback(async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    if (!currentUser) return;
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: generateUUID(),
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);

    if (!currentUser.isDemo) {
      await syncEvidenceInsert(currentUser.id, newEntry);
    }
    showSuccess('Outcome logged in Case File & permanently saved!');
  }, [currentUser]);

  return {
    evidenceEntries,
    setEvidenceEntries,
    logEvidence
  };
}