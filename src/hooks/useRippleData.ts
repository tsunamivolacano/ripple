import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog,
  ProcrastinationDebt, 
  UserSettings,
  NotificationSettings
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { 
  scheduleTaskNotifications, 
  scheduleClassNotifications, 
  cancelItemNotifications, 
  getNextSlotDateISO 
} from '@/utils/notificationService';
import { UserAccount } from './useRippleAuth';
import { ActivityLogger } from '@/services/activityLogger';

// Add missing method signatures to ActivityLogger
declare module '@/services/activityLogger' {
  export interface ActivityLogger {
    userRegistered: (userId: string, email: string, details?: Record<string, any>) => Promise<void>;
    userLogin: (userId: string, email: string, details?: Record<string, any>) => Promise<void>;
    userLogout: (userId: string, email: string, details?: Record<string, any>) => Promise<void>;
    passwordResetRequested: (userId: string, email: string, details?: Record<string, any>) => Promise<void>;
    taskCreated: (userId: string, taskId: string, title: string, details?: Record<string, any>) => Promise<void>;
    taskUpdated: (userId: string, taskId: string, title: string, details?: Record<string, any>) => Promise<void>;
    taskReopened: (userId: string, taskId: string, title: string, details?: Record<string, any>) => Promise<void>;
    taskDeleted: (userId: string, taskId: string, title: string, details?: Record<string, any>) => Promise<void>;
    calendarEventCreated: (userId: string, eventId: string, title: string, details?: Record<string, any>) => Promise<void>;
    calendarEventUpdated: (userId: string, eventId: string, title: string, details?: Record<string, any>) => Promise<void>;
    calendarEventDeleted: (userId: string, eventId: string, title: string, details?: Record<string, any>) => Promise<void>;
    aiPromptSubmitted: (userId: string, details?: Record<string, any>) => Promise<void>;
    aiResponseReceived: (userId: string, details?: Record<string, any>) => Promise<void>;
    aiRequestFailed: (userId: string, details?: Record<string, any>) => Promise<void>;
    pageOpened: (userId: string, route: string, details?: Record<string, any>) => Promise<void>;
    settingChanged: (userId: string, details?: Record<string, any>) => Promise<void>;
    error: (userId: string, message: string, details?: Record<string, any>) => Promise<void>;
    warning: (userId: string, message: string, details?: Record<string, any>) => Promise<void>;
    slotAdded: (userId: string, slotId: string, subject: string, details?: Record<string, any>) => Promise<void>;
    slotUpdated: (userId: string, slotId: string, subject: string, details?: Record<string, any>) => Promise<void>;
    slotDeleted: (userId: string, slotId: string, subject: string, details?: Record<string, any>) => Promise<void>;
    taskRenegotiated: (userId: string, taskId: string, title: string, details?: Record<string, any>) => Promise<void>;
    evidenceLogged: (userId: string, evidenceId: string, taskTitle: string, details?: Record<string, any>) => Promise<void>;
    studyLogAdded: (userId: string, studyLogId: string, subject: string, details?: Record<string, any>) => Promise<void>;
    studyLogDeleted: (userId: string, studyLogId: string, subject: string, details?: Record<string, any>) => Promise<void>;
    settingsUpdated: (userId: string, details: Record<string, any>) => Promise<void>;
  }
}