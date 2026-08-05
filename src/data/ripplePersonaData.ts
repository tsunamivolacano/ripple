import { TimetableSlot, Task, EvidenceEntry, ProcrastinationDebt, UserSettings, IntensityMode } from '@/types/ripple';

export interface PersonaBundle {
  id: string;
  name: string;
  role: string;
  avatarBadge: string;
  settings: UserSettings;
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  debt: ProcrastinationDebt;
}

const riyaSlots: TimetableSlot[] = [
  {
    id: 'riya-slot-chem',
    subject: 'Chemistry',
    dayOfWeek: 'Monday',
    startTime: '06:00',
    endTime: '06:45',
    room: 'Lab 3',
    teacherName: 'Mr. Verma',
    strictnessTag: 'COLD_CALL',
    stakesTag: 'LAB_PRACTICAL',
    weight: 40,
    notes: 'Cold-calls & notebook checks every Monday.'
  },
  {
    id: 'riya-slot-math',
    subject: 'Mathematics',
    dayOfWeek: 'Tuesday',
    startTime: '07:00',
    endTime: '07:45',
    room: 'Room 201',
    teacherName: 'Mrs. Iyer',
    strictnessTag: 'NOTEBOOK_CHECK',
    stakesTag: 'GRADED_QUIZ',
    weight: 35,
    notes: 'Checks working steps and numerical metrics closely.'
  },
  {
    id: 'riya-slot-eng',
    subject: 'English',
    dayOfWeek: 'Thursday',
    startTime: '09:00',
    endTime: '09:45',
    room: 'Hall B',
    teacherName: 'Ms. Kapoor',
    strictnessTag: 'LENIENT',
    stakesTag: 'HOMEWORK',
    weight: 10,
    notes: 'Lenient submission policies.'
  }
];

const riyaTasks: Task[] = [
  {
    id: 'riya-task-1',
    title: 'Finish Chemistry lab report',
    description: 'Titration calculations and diagram conclusions for Mr. Verma.',
    slotId: 'riya-slot-chem',
    dueDate: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    estimatedHours: 2.5,
    completionPercentage: 60,
    taskType: 'lab_report',
    status: 'critical',
    createdAt: new Date().toISOString()
  },
  {
    id: 'riya-task-2',
    title: 'Complete Math problem set',
    description: 'Integration exercises 1 through 15.',
    slotId: 'riya-slot-math',
    dueDate: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    estimatedHours: 3.0,
    completionPercentage: 20,
    taskType: 'problem_set',
    status: 'tight',
    createdAt: new Date().toISOString()
  }
];

const amanSlots: TimetableSlot[] = [
  {
    id: 'aman-slot-standup',
    subject: 'Daily Standup',
    dayOfWeek: 'Monday',
    startTime: '09:30',
    endTime: '09:45',
    room: 'Google Meet',
    teacherName: 'Neha (Team Lead)',
    strictnessTag: 'ATTENDANCE_STRICT',
    stakesTag: 'PRESENTATION',
    weight: 20,
    notes: 'Data-driven updates expected.'
  },
  {
    id: 'aman-slot-client',
    subject: 'Client Review Call',
    dayOfWeek: 'Friday',
    startTime: '16:00',
    endTime: '17:00',
    room: 'Executive Boardroom',
    teacherName: 'Meridian Corp Stakeholders',
    strictnessTag: 'PUBLIC_SCOLD',
    stakesTag: 'PRESENTATION',
    weight: 70,
    notes: 'High stakes, escalates fast if deliverables lag.'
  },
  {
    id: 'aman-slot-sprint',
    subject: 'Sprint Demo',
    dayOfWeek: 'Wednesday',
    startTime: '15:00',
    endTime: '15:30',
    room: 'Main Zoom Room',
    teacherName: 'Rakesh (Product Manager)',
    strictnessTag: 'COLD_CALL',
    stakesTag: 'PRESENTATION',
    weight: 50,
    notes: 'Public callouts if feature metrics miss expectations.'
  }
];

const amanTasks: Task[] = [
  {
    id: 'aman-task-1',
    title: 'Finish client deliverable deck',
    description: 'Q3 Analytics presentation slides and financial forecasting charts.',
    slotId: 'aman-slot-client',
    dueDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    estimatedHours: 4.0,
    completionPercentage: 45,
    taskType: 'project',
    status: 'critical',
    createdAt: new Date().toISOString()
  },
  {
    id: 'aman-task-2',
    title: 'Prep sprint demo walkthrough',
    description: 'Test API endpoint responses and record 3-minute video overview.',
    slotId: 'aman-slot-sprint',
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    estimatedHours: 1.5,
    completionPercentage: 70,
    taskType: 'revision',
    status: 'manageable',
    createdAt: new Date().toISOString()
  }
];

const kabirSlots: TimetableSlot[] = [
  {
    id: 'kabir-slot-sci',
    subject: 'Science Class',
    dayOfWeek: 'Monday',
    startTime: '08:30',
    endTime: '09:10',
    room: 'Class 7-A',
    teacherName: 'Mrs. Das',
    strictnessTag: 'NOTEBOOK_CHECK',
    stakesTag: 'NOTEBOOK_COPY',
    weight: 30,
    notes: 'Strict notebook diagram checks.'
  },
  {
    id: 'kabir-slot-evs',
    subject: 'EVS Project',
    dayOfWeek: 'Tuesday',
    startTime: '10:00',
    endTime: '10:40',
    room: 'Science Lab',
    teacherName: 'Mr. Rao',
    strictnessTag: 'QUIET_TALK',
    stakesTag: 'LAB_PRACTICAL',
    weight: 25,
    notes: 'Quiet follow-up if work is incomplete.'
  },
  {
    id: 'kabir-slot-hindi',
    subject: 'Hindi',
    dayOfWeek: 'Thursday',
    startTime: '11:00',
    endTime: '11:40',
    room: 'Room 12',
    teacherName: 'Mrs. Sharma',
    strictnessTag: 'LENIENT',
    stakesTag: 'HOMEWORK',
    weight: 10,
    notes: 'Gentle feedback.'
  }
];

const kabirTasks: Task[] = [
  {
    id: 'kabir-task-1',
    title: 'Finish Science homework',
    description: 'Draw plant cell diagram with color pencils.',
    slotId: 'kabir-slot-sci',
    dueDate: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    estimatedHours: 1.5,
    completionPercentage: 30,
    taskType: 'reading',
    status: 'tight',
    createdAt: new Date().toISOString()
  },
  {
    id: 'kabir-task-2',
    title: 'Build EVS project model piece',
    description: 'Assemble cardboard solar system structure.',
    slotId: 'kabir-slot-evs',
    dueDate: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    estimatedHours: 2.0,
    completionPercentage: 50,
    taskType: 'project',
    status: 'manageable',
    createdAt: new Date().toISOString()
  }
];

export const PERSONAS_MAP: Record<string, PersonaBundle> = {
  riya: {
    id: 'riya',
    name: 'Riya Verma',
    role: 'Student (Class 11)',
    avatarBadge: '🎓',
    settings: {
      intensityMode: 'standard',
      isMinorProfile: false,
      weeklyDigestOnly: false,
      personalVelocityMultiplier: 1.15
    },
    slots: riyaSlots,
    tasks: riyaTasks,
    evidenceEntries: [
      {
        id: 'riya-ev-1',
        taskId: 'riya-task-1',
        taskTitle: 'Chemistry Chapter 4 Quiz Prep',
        subject: 'Chemistry',
        teacherName: 'Mr. Verma',
        predictedScenario: 'Cold-call spot check in front of 40 students.',
        actualOutcome: 'Completed on time. Got 9/10 on the spot questions.',
        wasOnTime: true,
        accuracyRating: 5,
        dateLogged: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        userNotes: 'Starting 2 hours earlier completely eliminated class anxiety.'
      }
    ],
    debt: {
      totalHoursBehind: 1.5,
      missedDeadlinesCount: 0,
      streakDays: 4,
      compoundingScore: 25,
      weeklyDebtTrend: [
        { day: 'Mon', debtHours: 0.5 },
        { day: 'Tue', debtHours: 1.0 },
        { day: 'Wed', debtHours: 0.0 },
        { day: 'Thu', debtHours: 1.5 },
        { day: 'Fri', debtHours: 0.5 },
        { day: 'Sat', debtHours: 0.0 },
        { day: 'Sun', debtHours: 1.5 }
      ]
    }
  },
  aman: {
    id: 'aman',
    name: 'Aman Verma',
    role: 'Corporate Analyst',
    avatarBadge: '💼',
    settings: {
      intensityMode: 'doomsday',
      isMinorProfile: false,
      weeklyDigestOnly: false,
      personalVelocityMultiplier: 1.2
    },
    slots: amanSlots,
    tasks: amanTasks,
    evidenceEntries: [
      {
        id: 'aman-ev-1',
        taskId: 'aman-task-1',
        taskTitle: 'Q2 Performance Summary Report',
        subject: 'Client Review Call',
        teacherName: 'Meridian Corp Stakeholders',
        predictedScenario: 'Public escalation to VP if figures delayed past 4 PM.',
        actualOutcome: 'Delivered at 3:45 PM. Zero escalation triggered.',
        wasOnTime: true,
        accuracyRating: 5,
        dateLogged: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        userNotes: 'Doomsday mode framing pushed me to finish slides before lunch.'
      }
    ],
    debt: {
      totalHoursBehind: 3.0,
      missedDeadlinesCount: 1,
      streakDays: 2,
      compoundingScore: 55,
      weeklyDebtTrend: [
        { day: 'Mon', debtHours: 2.0 },
        { day: 'Tue', debtHours: 3.5 },
        { day: 'Wed', debtHours: 1.0 },
        { day: 'Thu', debtHours: 4.0 },
        { day: 'Fri', debtHours: 3.0 },
        { day: 'Sat', debtHours: 0.5 },
        { day: 'Sun', debtHours: 3.0 }
      ]
    }
  },
  kabir: {
    id: 'kabir',
    name: 'Kabir Mehta',
    role: 'School Kid (Class 7)',
    avatarBadge: '🚀',
    settings: {
      intensityMode: 'coach',
      isMinorProfile: true,
      weeklyDigestOnly: true,
      personalVelocityMultiplier: 1.0
    },
    slots: kabirSlots,
    tasks: kabirTasks,
    evidenceEntries: [],
    debt: {
      totalHoursBehind: 0.5,
      missedDeadlinesCount: 0,
      streakDays: 6,
      compoundingScore: 10,
      weeklyDebtTrend: [
        { day: 'Mon', debtHours: 0.0 },
        { day: 'Tue', debtHours: 0.5 },
        { day: 'Wed', debtHours: 0.0 },
        { day: 'Thu', debtHours: 0.0 },
        { day: 'Fri', debtHours: 0.5 },
        { day: 'Sat', debtHours: 0.0 },
        { day: 'Sun', debtHours: 0.5 }
      ]
    }
  }
};

export const ALL_PERSONAS = Object.values(PERSONAS_MAP);