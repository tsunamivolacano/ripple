import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  ProcrastinationDebt, 
  UserSettings, 
  TaskStatus 
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { showSuccess, showError } from '@/utils/toast';

interface RippleContextType {
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  activeTaskForPrediction: Task | null;
  activeFocusTask: Task | null;
  completedTaskForCelebration: Task | null;
  setActiveTaskForPrediction: (task: Task | null) => void;
  setActiveFocusTask: (task: Task | null) => void;
  setCompletedTaskForCelebration: (task: Task | null) => void;
  
  // Slot management
  addSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateSlot: (slot: TimetableSlot) => void;
  deleteSlot: (id: string) => void;

  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTaskProgress: (taskId: string, percentage: number) => void;
  completeTask: (taskId: string) => void;
  renegotiateTask: (taskId: string, newDueDate: string, reason: string) => void;
  deleteTask: (id: string) => void;

  // Evidence log management
  logEvidence: (entry: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => void;

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Utility action
  loadSampleData: () => void;
  resetAllData: () => void;
}

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.15
};

const initialSampleSlots: TimetableSlot[] = [
  {
    id: 'slot-1',
    subject: 'Physics',
    dayOfWeek: 'Monday',
    startTime: '08:30',
    endTime: '09:45',
    room: 'Lab 204',
    teacherName: 'Dr. Sharma',
    strictnessTag: 'COLD_CALL',
    stakesTag: 'LAB_PRACTICAL',
    weight: 35,
    notes: 'Always checks numerical problem sets before class starts.'
  },
  {
    id: 'slot-2',
    subject: 'Chemistry',
    dayOfWeek: 'Tuesday',
    startTime: '10:00',
    endTime: '11:15',
    room: 'Hall 102',
    teacherName: 'Prof. Mukherjee',
    strictnessTag: 'NOTEBOOK_CHECK',
    stakesTag: 'NOTEBOOK_COPY',
    weight: 25,
    notes: 'Demands neat handwritten diagrams.'
  },
  {
    id: 'slot-3',
    subject: 'Mathematics',
    dayOfWeek: 'Wednesday',
    startTime: '11:30',
    endTime: '12:45',
    room: 'Room 305',
    teacherName: 'Mrs. Verma',
    strictnessTag: 'PUBLIC_SCOLD',
    stakesTag: 'GRADED_QUIZ',
    weight: 40,
    notes: 'Calls out unsubmitted calculus sheets in front of the batch.'
  },
  {
    id: 'slot-4',
    subject: 'English Literature',
    dayOfWeek: 'Thursday',
    startTime: '09:00',
    endTime: '10:15',
    room: 'Auditorium B',
    teacherName: 'Mr. Kapoor',
    strictnessTag: 'ATTENDANCE_STRICT',
    stakesTag: 'PRESENTATION',
    weight: 20,
    notes: 'Door locked exactly at 9:00 AM.'
  }
];

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

const initialSampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Physics Wave Optics Lab Problem Set',
    description: 'Solve 12 numericals on double-slit interference and write error analysis.',
    slotId: 'slot-1',
    dueDate: hoursFromNow(2.5), // Urgent!
    estimatedHours: 2.0,
    completionPercentage: 20,
    taskType: 'problem_set',
    status: 'critical',
    createdAt: hoursAgo(20)
  },
  {
    id: 'task-2',
    title: 'Chemistry Electrochemistry Diagram & Equations',
    description: 'Complete galvanic cell diagram and reduction potential practice calculations.',
    slotId: 'slot-2',
    dueDate: hoursFromNow(18),
    estimatedHours: 1.5,
    completionPercentage: 50,
    taskType: 'lab_report',
    status: 'tight',
    createdAt: hoursAgo(12)
  },
  {
    id: 'task-3',
    title: 'Calculus Integration Limits Revision Sheet',
    description: 'Definite integrals and substitution method homework problems 1 to 25.',
    slotId: 'slot-3',
    dueDate: hoursFromNow(48),
    estimatedHours: 3.0,
    completionPercentage: 0,
    taskType: 'revision',
    status: 'manageable',
    createdAt: hoursAgo(5)
  },
  {
    id: 'task-4',
    title: 'English Hamlet Theme Analysis Essay',
    description: '1,200-word critical analysis on madness vs feigned madness in Act III.',
    slotId: 'slot-4',
    dueDate: hoursAgo(2), // Overdue!
    estimatedHours: 2.5,
    completionPercentage: 40,
    taskType: 'essay',
    status: 'too_late',
    createdAt: hoursAgo(30)
  }
];

const initialSampleEvidence: EvidenceEntry[] = [
  {
    id: 'ev-1',
    taskId: 'hist-1',
    taskTitle: 'Organic Chemistry Reaction Mechanisms',
    subject: 'Chemistry',
    teacherName: 'Prof. Mukherjee',
    predictedScenario: 'Notebook check failure would lead to zero copy marks and stern warning.',
    actualOutcome: 'Got pulled aside, lost 5 marks on internal notebook evaluation.',
    wasOnTime: false,
    accuracyRating: 5,
    dateLogged: hoursAgo(72),
    userNotes: 'Prediction was 100% accurate. Should not have delayed till 2 AM.'
  },
  {
    id: 'ev-2',
    taskId: 'hist-2',
    taskTitle: 'Physics Kinematics Numerical Sheet',
    subject: 'Physics',
    teacherName: 'Dr. Sharma',
    predictedScenario: 'Cold-call in class; inability to present solution.',
    actualOutcome: 'Finished on time! Doctor Sharma checked and praised neat vector diagrams.',
    wasOnTime: true,
    accuracyRating: 4,
    dateLogged: hoursAgo(120),
    userNotes: 'Felt confident answering in class when called upon.'
  }
];

const initialDebt: ProcrastinationDebt = {
  totalHoursBehind: 4.5,
  missedDeadlinesCount: 2,
  streakDays: 3,
  compoundingScore: 68,
  weeklyDebtTrend: [
    { day: 'Mon', debtHours: 1.5 },
    { day: 'Tue', debtHours: 2.0 },
    { day: 'Wed', debtHours: 1.0 },
    { day: 'Thu', debtHours: 3.5 },
    { day: 'Fri', debtHours: 4.5 },
    { day: 'Sat', debtHours: 4.0 },
    { day: 'Sun', debtHours: 4.5 }
  ]
};

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('ripple_slots');
    return saved ? JSON.parse(saved) : initialSampleSlots;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ripple_tasks');
    return saved ? JSON.parse(saved) : initialSampleTasks;
  });

  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>(() => {
    const saved = localStorage.getItem('ripple_evidence');
    return saved ? JSON.parse(saved) : initialSampleEvidence;
  });

  const [debt, setDebt] = useState<ProcrastinationDebt>(() => {
    const saved = localStorage.getItem('ripple_debt');
    return saved ? JSON.parse(saved) : initialDebt;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('ripple_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('ripple_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('ripple_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ripple_evidence', JSON.stringify(evidenceEntries));
  }, [evidenceEntries]);

  useEffect(() => {
    localStorage.setItem('ripple_debt', JSON.stringify(debt));
  }, [debt]);

  useEffect(() => {
    localStorage.setItem('ripple_settings', JSON.stringify(settings));
  }, [settings]);

  // Dynamic Ticker: refresh task statuses every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.status === 'completed' || t.status === 'renegotiated') return t;
          const newStatus = calculateTaskStatus(t.dueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier);
          return { ...t, status: newStatus };
        })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [settings.personalVelocityMultiplier]);

  const addSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`
    };
    setSlots((prev) => [...prev, newSlot]);
    showSuccess(`Timetable slot for ${newSlot.subject} created.`);
  };

  const updateSlot = (updatedSlot: TimetableSlot) => {
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
    showSuccess(`Updated ${updatedSlot.subject} slot.`);
  };

  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Timetable slot removed.');
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const computedStatus = calculateTaskStatus(
      taskData.dueDate,
      taskData.estimatedHours,
      taskData.completionPercentage,
      settings.personalVelocityMultiplier
    );

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: computedStatus
    };

    setTasks((prev) => [newTask, ...prev]);
    showSuccess(`Task "${newTask.title}" added to War Room.`);
  };

  const updateTaskProgress = (taskId: string, percentage: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updatedStatus = isComplete
            ? 'completed'
            : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier);

          const updatedTask = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };

          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
            // Update debt streak
            setDebt((d) => ({
              ...d,
              streakDays: d.streakDays + 1,
              compoundingScore: Math.max(10, d.compoundingScore - 5)
            }));
          }

          return updatedTask;
        }
        return t;
      })
    );
  };

  const completeTask = (taskId: string) => {
    updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = (taskId: string, newDueDate: string, reason: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier);
          return {
            ...t,
            dueDate: newDueDate,
            renegotiatedCount: count,
            lastRenegotiatedAt: new Date().toISOString(),
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
        }
        return t;
      })
    );

    // Increase debt slightly for renegotiation penalty
    setDebt((prev) => ({
      ...prev,
      totalHoursBehind: prev.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, prev.compoundingScore + 8)
    }));

    showSuccess('Task schedule renegotiated. Doomsday Clock reset.');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showSuccess('Task removed.');
  };

  const logEvidence = (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    showSuccess('Outcome logged in Evidence Case File!');
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showSuccess('Settings updated.');
  };

  const loadSampleData = () => {
    setSlots(initialSampleSlots);
    setTasks(initialSampleTasks);
    setEvidenceEntries(initialSampleEvidence);
    setDebt(initialDebt);
    setSettings(defaultSettings);
    showSuccess('Loaded sample data (Riya - Class 11 Student profile)');
  };

  const resetAllData = () => {
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    setDebt({
      totalHoursBehind: 0,
      missedDeadlinesCount: 0,
      streakDays: 0,
      compoundingScore: 0,
      weeklyDebtTrend: []
    });
    showSuccess('All data reset.');
  };

  return (
    <RippleContext.Provider
      value={{
        slots,
        tasks,
        evidenceEntries,
        debt,
        settings,
        activeTaskForPrediction,
        activeFocusTask,
        completedTaskForCelebration,
        setActiveTaskForPrediction,
        setActiveFocusTask,
        setCompletedTaskForCelebration,
        addSlot,
        updateSlot,
        deleteSlot,
        addTask,
        updateTaskProgress,
        completeTask,
        renegotiateTask,
        deleteTask,
        logEvidence,
        updateSettings,
        loadSampleData,
        resetAllData
      }}
    >
      {children}
    </RippleContext.Provider>
  );
};

export const useRipple = () => {
  const context = useContext(RippleContext);
  if (!context) {
    throw new Error('useRipple must be used within a RippleProvider');
  }
  return context;
};