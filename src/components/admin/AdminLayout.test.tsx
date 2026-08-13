import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useRippleAuth } from '@/hooks/useRippleAuth';
import { useRippleData } from '@/hooks/useRippleData';
import { supabase } from '@/integrations/supabase/client';

// Mock the ripple auth hook
jest.mock('@/hooks/useRippleAuth', () => ({
  useRippleAuth: jest.fn(),
}));

// Mock the ripple data hook
jest.mock('@/hooks/useRippleData', () => ({
  useRippleData: jest.fn(),
}));

// Mock the admin service
jest.mock('@/services/adminService', () => ({
  verifyAdminAccess: jest.fn(),
  fetchAdminOverview: jest.fn(),
  fetchAdminUsersList: jest.fn(),
  subscribeToAdminUpdates: jest.fn(),
}));

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      admin: {
        listUsers: jest.fn(),
      },
    },
    from: jest.fn(),
    authStateChange: {
      subscribe: jest.fn(),
    },
  },
}));

// Mock the activity logger
jest.mock('@/services/activityLogger', () => ({
  ActivityLogger: {
    userLogin: jest.fn(),
    userRegistered: jest.fn(),
    userLogout: jest.fn(),
    taskCreated: jest.fn(),
    taskUpdated: jest.fn(),
    taskDeleted: jest.fn(),
    taskRenegotiated: jest.fn(),
    studyLogAdded: jest.fn(),
    studyLogDeleted: jest.fn(),
    evidenceLogged: jest.fn(),
    settingsUpdated: jest.fn(),
    slotAdded: jest.fn(),
    slotUpdated: jest.fn(),
    slotDeleted: jest.fn(),
  },
}));

// Mock storage utilities
jest.mock('@/utils/storageUtils', () => ({
  safeGetStorage: jest.fn(),
  safeSetStorage: jest.fn(),
  getLocalUserId: jest.fn(),
}));

// Mock ripple persona data
jest.mock('@/data/ripplePersonaData', () => ({
  PERSONAS_MAP: {
    riya: {
      id: 'demo_riya',
      name: 'Riya Sharma',
      email: 'riya.sharma@demo.ripple',
      slots: [
        {
          id: 'slot-1',
          subject: 'Physics',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room 201',
          teacherName: 'Dr. Patel',
          strictnessTag: 'COLD_CALL',
          stakesTag: 'GRADED_QUIZ',
          weight: 85,
          reminders: ['15m'],
          recurrence: { type: 'none' },
          specificDate: null,
          notes: 'Focus on wave-particle duality',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Complete Wave Optics Problems',
          description: 'Finish exercises 3.1-3.5',
          slotId: 'slot-1',
          hasDeadline: true,
          dueDate: '2023-11-15T23:59:59Z',
          estimatedHours: 5,
          completionPercentage: 0,
          taskType: 'problem_set',
          category: 'academic',
          status: 'manageable',
          reminders: ['15m'],
          recurrence: { type: 'none' },
          createdAt: '2023-11-01T10:00:00Z',
          completedAt: null,
          renegotiatedCount: 0,
          lastRenegotiated: null,
        },
      ],
      evidenceEntries: [
        {
          id: 'ev-1',
          taskId: 'task-1',
          taskTitle: 'Complete Wave Optics Problems',
          subject: 'Physics',
          teacherName: 'Dr. Patel',
          predictedScenario: 'Will struggle with interference equations',
          actualOutcome: 'Completed with 92% accuracy',
          wasOnTime: true,
          accuracyRating: 4,
          dateLogged: '2023-11-02T14:30:00Z',
          userNotes: 'Need to review double-slit derivations',
        },
      ],
      studyLogs: [
        {
          id: 'st-1',
          subject: 'Physics',
          durationMinutes: 90,
          topic: 'Wave Optics & Double Slit Interference',
          loggedAt: '2023-11-01T14:00:00Z',
          source: 'manual',
        },
      ],
      debt: {
        totalHoursBehind: 0,
        missedDeadlinesCount: 0,
        streakDays: 0,
        compoundingScore: 0,
        weeklyDebtTrend: [
          { day: 'Mon', debtHours: 0 },
          { day: 'Tue', debtHours: 0 },
          { day: 'Wed', debtHours: 0 },
          { day: 'Thu', debtHours: 0 },
          { day: 'Fri', debtHours: 0 },
          { day: 'Sat', debtHours: 0 },
          { day: 'Sun', debtHours: 0 },
        ],
      },
      settings: {
        intensityMode: 'standard',
        isMinorProfile: false,
        weeklyDigestOnly: false,
        personalVelocityMultiplier: 1.0,
      },
    },
  },
  defaultPersona: {
    id: 'riya',
    name: 'Riya Sharma',
    email: 'riya.sharma@demo.ripple',
    slots: [],
    tasks: [],
    evidenceEntries: [],
    studyLogs: [],
    debt: {
      totalHoursBehind: 0,
      missedDeadlinesCount: 0,
      streakDays: 0,
      compoundingScore: 0,
      weeklyDebtTrend: [],
    },
    settings: {
      intensityMode: 'standard',
      isMinorProfile: false,
      weeklyDigestOnly: false,
      personalVelocityMultiplier: 1.0,
    },
  },
}));

describe('Admin Dashboard End-to-End Flow', () => {
  let mockUser: any;
  let mockAdminAccess: boolean;
  let mockOverview: any;
  let mockUsersList: any;

  beforeAll(() => {
    // Setup mocks
    mockUser = {
      id: 'demo_riya',
      email: 'riya.sharma@demo.ripple',
      user_metadata: {
        name: 'Riya Sharma',
      },
      created_at: '2023-10-15T10:00:00Z',
      last_sign_in_at: '2023-11-01T14:30:00Z',
    };

    mockAdminAccess = true;
    mockOverview = {
      metrics: {
        totalRegisteredUsers: 42,
        activeUsers7Days: 18,
        newUsers7Days: 5,
        totalTasksCreated: 127,
        completedTasks: 89,
        totalStudyMinutesLogged: 345,
        timerSessionsCount: 12,
        avgSessionDurationMinutes: 28,
        calendarEventsCount: 45,
        generalTasksCount: 23,
      },
      subjectBreakdown: [
        {
          subject: 'Physics',
          studyMinutes: 180,
          sessions: 3,
        },
        {
          subject: 'Mathematics',
          studyMinutes: 120,
          sessions: 2,
        },
        {
          subject: 'Chemistry',
          studyMinutes: 45,
          sessions: 1,
        },
      ],
      userActivityTrend: [
        {
          date: 'Mon',
          activeUsers: 15,
          tasksCompleted: 8,
          studyHours: 12.5,
        },
        {
          date: 'Tue',
          activeUsers: 18,
          tasksCompleted: 12,
          studyHours: 15.2,
        },
        {
          date: 'Wed',
          activeUsers: 14,
          tasksCompleted: 7,
          studyHours: 11.8,
        },
        {
          date: 'Thu',
          activeUsers: 16,
          tasksCompleted: 10,
          studyHours: 13.7,
        },
        {
          date: 'Fri',
          activeUsers: 20,
          tasksCompleted: 14,
          studyHours: 16.3,
        },
        {
          date: 'Sat',
          activeUsers: 12,
          tasksCompleted: 5,
          studyHours: 9.4,
        },
        {
          date: 'Sun',
          activeUsers: 10,
          tasksCompleted: 3,
          studyHours: 8.1,
        },
      ],
    };
    mockUsersList = [
      {
        id: 'demo_riya',
        email: 'riya.sharma@demo.ripple',
        name: 'Riya Sharma',
        createdAt: '2023-10-15T10:00:00Z',
        lastActivity: '2023-11-01T14:30:00Z',
        tasksCreated: 1,
        tasksCompleted: 0,
        studyHours: '2.5',
        timerSessions: 1,
        calendarEvents: 0,
        role: 'student',
      },
      {
        id: 'admin_001',
        email: 'admin@ripple.com',
        name: 'Admin User',
        createdAt: '2023-09-10T09:00:00Z',
        lastActivity: '2023-11-01T10:00:00Z',
        tasksCreated: 5,
        tasksCompleted: 3,
        studyHours: '15.2',
        timerSessions: 5,
        calendarEvents: 2,
        role: 'admin',
      },
    ];

    // Setup mock implementations
    (useRippleAuth as jest.Mock).mockImplementation(() => ({
      currentUser: mockUser,
      loginWithEmail: jest.fn(),
      signUpWithEmail: jest.fn(),
      loginDemoAccount: jest.fn(),
      logout: jest.fn(),
    }));

    (useRippleData as jest.Mock).mockImplementation(() => ({
      slots: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].slots : [],
      tasks: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].tasks : [],
      evidenceEntries: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].evidenceEntries : [],
      studyLogs: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].studyLogs : [],
      debt: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].debt : {},
      settings: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].settings : {},
      notificationSettings: mockOverview.subjectBreakdown[0]?.subject ? mockOverview.subjectBreakdown[0].notificationSettings : {},
      currentPersonaId: 'riya',
      activeTaskForPrediction: null,
      activeFocusTask: null,
      completedTaskForCelebration: null,
      isLoadingData: false,
      isNotificationModalOpen: false,
      setNotificationModalOpen: jest.fn(),
      setActiveTaskForPrediction: jest.fn(),
      setActiveFocusTask: jest.fn(),
      setCompletedTaskForCelebration: jest.fn(),
      addSlot: jest.fn(),
      updateSlot: jest.fn(),
      deleteSlot: jest.fn(),
      addTask: jest.fn(),
      updateTaskProgress: jest.fn(),
      completeTask: jest.fn(),
      renegotiateTask: jest.fn(),
      deleteTask: jest.fn(),
      logEvidence: jest.fn(),
      addStudyLog: jest.fn(),
      deleteStudyLog: jest.fn(),
      updateSettings: jest.fn(),
      updateNotificationSettings: jest.fn(),
      loadPersonaData: jest.fn(),
      resetAllData: jest.fn(),
    }));

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => ({
      subscribe: cb,
      unsubscribe: jest.fn(),
    }));

    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    }));

    (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
      data: {
        users: [
          {
            id: 'demo_riya',
            email: 'riya.sharma@demo.ripple',
            user_metadata: { name: 'Riya Sharma' },
            created_at: '2023-10-15T10:00:00Z',
            last_sign_in_at: '2023-11-01T14:30:00Z',
          },
          {
            id: 'admin_001',
            email: 'admin@ripple.com',
            user_metadata: { name: 'Admin User' },
            created_at: '2023-09-10T09:00:00Z',
            last_sign_in_at: '2023-11-01T10:00:00Z',
          },
        ],
      },
    });

    (supabase.storage as jest.Mock).mockImplementation({
      from: jest.fn(),
    });

    (verifyAdminAccess as jest.Mock).mockResolvedValue(true);
    (fetchAdminOverview as jest.Mock).mockResolvedValue(mockOverview);
    (fetchAdminUsersList as jest.Mock).mockResolvedValue(mockUsersList);
    (subscribeToAdminUpdates as jest.Mock).mockImplementation(() => jest.fn());
  });

  it('should complete the full user-to-admin data flow', async () => {
    // Render the admin layout
    const { container } = render(<AdminLayout onExitAdmin={jest.fn()} onImpersonateUser={jest.fn()} />);

    // Wait for admin layout to load
    await waitFor(() => {
      expect(screen.getByText('RIPPLE Owner Console')).toBeInTheDocument();
    });

    // Verify admin access is checked
    expect(verifyAdminAccess).toHaveBeenCalled();

    // Verify admin users list is fetched
    expect(fetchAdminUsersList).toHaveBeenCalled();

    // Verify the users tab can be accessed
    const usersTabButton = screen.getByText('Registered Users');
    fireEvent.click(usersTabButton);

    // Wait for users list to load
    await waitFor(() => {
      expect(screen.getByText('Riya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Select the user
    const userRow = screen.getByText('Riya Sharma');
    fireEvent.click(userRow);

    // Verify user details are shown
    await waitFor(() => {
      expect(screen.getByText('Riya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('1 Tasks (Done)')).toBeInTheDocument();
      expect(screen.getByText('2.5 hrs')).toBeInTheDocument();
    });

    // Verify activity stream updates in real-time
    const activityTabButton = screen.getByText('Activity Stream');
    fireEvent.click(activityTabButton);

    // Wait for activity to load
    await waitFor(() => {
      expect(screen.getByText('Recent Account Events & Product Analytics')).toBeInTheDocument();
    });

    // Verify audit trail can be accessed
    const auditTabButton = screen.getByText('Audit Trail');
    fireEvent.click(auditTabButton);

    // Wait for audit trail to load
    await waitFor(() => {
      expect(screen.getByText('Admin Action Audit Log')).toBeInTheDocument();
    });

    // Verify real-time updates work
    // Trigger a simulated update
    (supabase.from as jest.Mock).mockImplementation((table) => ({
      update: jest.fn().mockResolvedValue({ data: {} }),
    }));

    // Simulate a new task creation
    const newTaskButton = screen.getByText('Add Task');
    fireEvent.click(newTaskButton);

    // Verify task creation flow
    expect(addTask).toHaveBeenCalled();

    // Verify the flow completes without errors
    expect(screen.getByText('Activity "Complete Wave Optics Problems" added successfully')).toBeInTheDocument();

    // Verify data persistence
    expect(localStorage.getItem('ripple_active_user')).toBe('{"id":"demo_riya","email":"riya.sharma@demo.ripple","isDemo":true}');
  });
});