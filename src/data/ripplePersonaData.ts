import { TimetableSlot, Task, EvidenceEntry, ProcrastinationDebt, UserSettings } from '@/types/ripple';

export type AttitudeTag =
  | "Cold-calls / puts you on the spot"
  | "Checks work at the start, strict"
  | "Lenient, rarely checks"
  | "Data-driven, checks metrics closely"
  | "Chill, async-friendly"
  | "Escalates to manager/skip-level fast"
  | "Public callout"
  | "Quiet one-on-one follow-up";

export interface RawTimetableSlot {
  id: string;
  label: string;
  day: string;
  startTime: string;
  endTime: string;
  location?: string;
  supervisorName: string;
  attitudeTag: AttitudeTag;
  stakes: string;
  weight: number;
}

export interface RawRippleTask {
  id: string;
  title: string;
  linkedSlotId: string;
  progressPercent: number;
  estimatedPrepMinutes: number;
  status: "not_started" | "in_progress" | "at_risk" | "done";
}

export interface RawEvidenceLogEntry {
  id: string;
  taskId: string;
  date: string;
  predicted: string;
  actual: string;
  matched: boolean;
}

export interface RawRipplePersona {
  id: string;
  name: string;
  role: string;
  ageGroup: string;
  intensityModeDefault: "coach" | "standard" | "doomsday";
  timetable: RawTimetableSlot[];
  tasks: RawRippleTask[];
  evidenceLog: RawEvidenceLogEntry[];
}

export interface FullPersonaBundle {
  id: string;
  name: string;
  role: string;
  ageGroup: string;
  avatarBadge: string;
  settings: UserSettings;
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  debt: ProcrastinationDebt;
}

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

// 1. RIYA VERMA (Class 11 High School Student)
const riyaBundle: FullPersonaBundle = {
  id: 'riya',
  name: 'Riya Verma',
  role: 'Class 11 High School Student',
  ageGroup: 'teen',
  avatarBadge: '🎓',
  settings: {
    intensityMode: 'doomsday',
    isMinorProfile: true,
    weeklyDigestOnly: false,
    personalVelocityMultiplier: 1.15
  },
  slots: [
    {
      id: 'riya-slot-1',
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
      id: 'riya-slot-2',
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
      id: 'riya-slot-3',
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
      id: 'riya-slot-4',
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
  ],
  tasks: [
    {
      id: 'riya-task-1',
      title: 'Physics Wave Optics Lab Problem Set',
      description: 'Solve 12 numericals on double-slit interference and write error analysis.',
      slotId: 'riya-slot-1',
      dueDate: hoursFromNow(2.5),
      estimatedHours: 2.0,
      completionPercentage: 20,
      taskType: 'problem_set',
      category: 'academic',
      status: 'critical',
      createdAt: hoursAgo(20)
    },
    {
      id: 'riya-task-personal-1',
      title: 'Dentist Checkup & Orthodontist Appointment',
      description: 'Routine teeth cleaning and brace wire adjustment at Dental Care Clinic.',
      dueDate: hoursFromNow(5.0),
      estimatedHours: 1.5,
      completionPercentage: 0,
      taskType: 'appointment',
      category: 'personal',
      status: 'tight',
      createdAt: hoursAgo(10)
    },
    {
      id: 'riya-task-2',
      title: 'Chemistry Electrochemistry Diagram & Equations',
      description: 'Complete galvanic cell diagram and reduction potential practice calculations.',
      slotId: 'riya-slot-2',
      dueDate: hoursFromNow(18),
      estimatedHours: 1.5,
      completionPercentage: 50,
      taskType: 'lab_report',
      category: 'academic',
      status: 'tight',
      createdAt: hoursAgo(12)
    },
    {
      id: 'riya-task-3',
      title: 'Calculus Integration Limits Revision Sheet',
      description: 'Definite integrals and substitution method homework problems 1 to 25.',
      slotId: 'riya-slot-3',
      dueDate: hoursFromNow(48),
      estimatedHours: 3.0,
      completionPercentage: 0,
      taskType: 'revision',
      category: 'academic',
      status: 'manageable',
      createdAt: hoursAgo(5)
    },
    {
      id: 'riya-task-4',
      title: 'English Hamlet Theme Analysis Essay',
      description: '1,200-word critical analysis on madness vs feigned madness in Act III.',
      slotId: 'riya-slot-4',
      dueDate: hoursAgo(2),
      estimatedHours: 2.5,
      completionPercentage: 40,
      taskType: 'essay',
      category: 'academic',
      status: 'too_late',
      createdAt: hoursAgo(30)
    }
  ],
  evidenceEntries: [
    {
      id: 'riya-ev-1',
      taskId: 'riya-hist-1',
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
      id: 'riya-ev-2',
      taskId: 'riya-hist-2',
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
  ],
  debt: {
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
  }
};

// 2. AMAN VERMA (Corporate Product Analyst, 27)
const amanBundle: FullPersonaBundle = {
  id: 'aman',
  name: 'Aman Verma',
  role: 'Product Analyst, Corporate',
  ageGroup: 'adult',
  avatarBadge: '💼',
  settings: {
    intensityMode: 'standard',
    isMinorProfile: false,
    weeklyDigestOnly: false,
    personalVelocityMultiplier: 1.25
  },
  slots: [
    {
      id: 'aman-slot-standup',
      subject: 'Daily Standup Meeting',
      dayOfWeek: 'Monday',
      startTime: '09:30',
      endTime: '09:45',
      room: 'Zoom / Slack Huddle',
      teacherName: 'Neha (Team Lead)',
      strictnessTag: 'COLD_CALL',
      stakesTag: 'PRESENTATION',
      weight: 30,
      notes: 'Expected to report yesterday deliverable status live with metrics.'
    },
    {
      id: 'aman-slot-clientreview',
      subject: 'Client Review Call',
      dayOfWeek: 'Friday',
      startTime: '16:00',
      endTime: '17:00',
      room: 'Google Meet (External)',
      teacherName: 'Meridian Corp VP',
      strictnessTag: 'PUBLIC_SCOLD',
      stakesTag: 'PRESENTATION',
      weight: 80,
      notes: 'Deliverable slip here risks account trust and quarter renewal.'
    },
    {
      id: 'aman-slot-sprintdemo',
      subject: 'Bi-weekly Sprint Demo',
      dayOfWeek: 'Wednesday',
      startTime: '15:00',
      endTime: '15:30',
      room: 'Floor 4 Conference Room',
      teacherName: 'Rakesh (Engineering Manager)',
      strictnessTag: 'PUBLIC_SCOLD',
      stakesTag: 'GRADED_QUIZ',
      weight: 50,
      notes: 'Incomplete work shown in front of leadership and 15 engineers.'
    }
  ],
  tasks: [
    {
      id: 'aman-task-deck',
      title: 'Finish Meridian Corp Q3 Deliverable Deck',
      description: 'Aggregate conversion funnel metrics, cohort retention charts, and ROI forecasting.',
      slotId: 'aman-slot-clientreview',
      dueDate: hoursFromNow(3.0),
      estimatedHours: 3.5,
      completionPercentage: 45,
      taskType: 'project',
      category: 'academic',
      status: 'critical',
      createdAt: hoursAgo(18)
    },
    {
      id: 'aman-task-personal-1',
      title: 'Quarterly Car Service & Oil Change Sync',
      description: 'Drop off vehicle at Honda Service Station and confirm pickup window.',
      dueDate: hoursFromNow(8.0),
      estimatedHours: 1.0,
      completionPercentage: 0,
      taskType: 'chore',
      category: 'personal',
      status: 'manageable',
      createdAt: hoursAgo(4)
    },
    {
      id: 'aman-task-demo',
      title: 'Prep Sprint Demo Walkthrough & Feature Clips',
      description: 'Record Loom video demo of checkout funnel optimization and test script.',
      slotId: 'aman-slot-sprintdemo',
      dueDate: hoursFromNow(22.0),
      estimatedHours: 1.0,
      completionPercentage: 70,
      taskType: 'revision',
      category: 'academic',
      status: 'tight',
      createdAt: hoursAgo(10)
    }
  ],
  evidenceEntries: [
    {
      id: 'aman-log-1',
      taskId: 'aman-hist-1',
      taskTitle: 'Weekly Analytics Report to VP',
      subject: 'Client Review Call',
      teacherName: 'Meridian Corp VP',
      predictedScenario: 'Client likely to flag delay and escalate to Rakesh via Slack.',
      actualOutcome: 'Client flagged delay on call; Rakesh followed up same day in 1-on-1.',
      wasOnTime: false,
      accuracyRating: 5,
      dateLogged: hoursAgo(48),
      userNotes: 'Escalation occurred exactly as AI predicted. Need deck ready early.'
    }
  ],
  debt: {
    totalHoursBehind: 6.0,
    missedDeadlinesCount: 3,
    streakDays: 1,
    compoundingScore: 76,
    weeklyDebtTrend: [
      { day: 'Mon', debtHours: 2.0 },
      { day: 'Tue', debtHours: 3.5 },
      { day: 'Wed', debtHours: 4.0 },
      { day: 'Thu', debtHours: 5.5 },
      { day: 'Fri', debtHours: 6.0 },
      { day: 'Sat', debtHours: 5.5 },
      { day: 'Sun', debtHours: 6.0 }
    ]
  }
};

// 3. KABIR MEHTA (Class 7 Student, 12)
const kabirBundle: FullPersonaBundle = {
  id: 'kabir',
  name: 'Kabir Mehta',
  role: 'Class 7 School Student',
  ageGroup: 'school',
  avatarBadge: '🚀',
  settings: {
    intensityMode: 'coach',
    isMinorProfile: true,
    weeklyDigestOnly: true,
    personalVelocityMultiplier: 1.10
  },
  slots: [
    {
      id: 'kabir-slot-science',
      subject: 'Science',
      dayOfWeek: 'Monday',
      startTime: '08:30',
      endTime: '09:10',
      room: 'Classroom 7B',
      teacherName: 'Mrs. Das',
      strictnessTag: 'NOTEBOOK_CHECK',
      stakesTag: 'NOTEBOOK_COPY',
      weight: 35,
      notes: 'Surprise homework checks, marks recorded directly in school diary.'
    },
    {
      id: 'kabir-slot-evs',
      subject: 'EVS Project Class',
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '10:40',
      room: 'Science Lab 1',
      teacherName: 'Mr. Rao',
      strictnessTag: 'QUIET_TALK',
      stakesTag: 'LAB_PRACTICAL',
      weight: 30,
      notes: 'Group project model checkpoint; quiet one-on-one progress review.'
    },
    {
      id: 'kabir-slot-hindi',
      subject: 'Hindi Literature',
      dayOfWeek: 'Thursday',
      startTime: '11:00',
      endTime: '11:40',
      room: 'Classroom 7B',
      teacherName: 'Mrs. Sharma',
      strictnessTag: 'LENIENT',
      stakesTag: 'HOMEWORK',
      weight: 15,
      notes: 'Reading aloud in class, low pressure homework check.'
    }
  ],
  tasks: [
    {
      id: 'kabir-task-scihw',
      title: 'Finish Science Chapter 4 Plant Diagram Homework',
      description: 'Draw labeled photosynthesis process diagram and answer Q1-Q5.',
      slotId: 'kabir-slot-science',
      dueDate: hoursFromNow(2.0),
      estimatedHours: 0.75,
      completionPercentage: 30,
      taskType: 'problem_set',
      category: 'academic',
      status: 'critical',
      createdAt: hoursAgo(8)
    },
    {
      id: 'kabir-task-personal-1',
      title: 'Practice Piano Recital Pieces (15 mins)',
      description: 'Practice Beethoven Fur Elise intro for Friday evening music recital.',
      dueDate: hoursFromNow(6.0),
      estimatedHours: 0.5,
      completionPercentage: 0,
      taskType: 'personal',
      category: 'personal',
      status: 'manageable',
      createdAt: hoursAgo(2)
    },
    {
      id: 'kabir-task-evsmodel',
      title: 'Build EVS Water Cycle Cardboard Model Piece',
      description: 'Glue cotton clouds and paint river system for group presentation.',
      slotId: 'kabir-slot-evs',
      dueDate: hoursFromNow(20.0),
      estimatedHours: 1.2,
      completionPercentage: 50,
      taskType: 'lab_report',
      category: 'academic',
      status: 'tight',
      createdAt: hoursAgo(14)
    }
  ],
  evidenceEntries: [
    {
      id: 'kabir-log-1',
      taskId: 'kabir-hist-1',
      taskTitle: 'Science Chapter 3 Worksheet',
      subject: 'Science',
      teacherName: 'Mrs. Das',
      predictedScenario: 'Diary note likely if homework isn not ready during morning check.',
      actualOutcome: 'Did not complete on time; received red note in school diary.',
      wasOnTime: false,
      accuracyRating: 5,
      dateLogged: hoursAgo(96),
      userNotes: 'Coach mode told me to finish by 6 PM. Next time I will listen!'
    }
  ],
  debt: {
    totalHoursBehind: 1.5,
    missedDeadlinesCount: 1,
    streakDays: 4,
    compoundingScore: 32,
    weeklyDebtTrend: [
      { day: 'Mon', debtHours: 0.5 },
      { day: 'Tue', debtHours: 1.0 },
      { day: 'Wed', debtHours: 0.8 },
      { day: 'Thu', debtHours: 1.5 },
      { day: 'Fri', debtHours: 1.2 },
      { day: 'Sat', debtHours: 1.0 },
      { day: 'Sun', debtHours: 1.5 }
    ]
  }
};

export const ALL_PERSONAS: FullPersonaBundle[] = [
  riyaBundle,
  amanBundle,
  kabirBundle
];

export const PERSONAS_MAP: Record<string, FullPersonaBundle> = {
  riya: riyaBundle,
  aman: amanBundle,
  kabir: kabirBundle
};

export const PERSONAS = PERSONAS_MAP;