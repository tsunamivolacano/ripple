import React, { useState } from 'react';
import { RippleProvider, useRipple } from '@/context/RippleContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { Navbar } from '@/components/header/Navbar';
import { WarRoom } from '@/components/doomsday/WarRoom';
import { StudyTrackerView } from '@/components/study/StudyTrackerView';
import { PredictionView } from '@/components/prediction/PredictionView';
import { FocusModeModal } from '@/components/prediction/FocusModeModal';
import { RenegotiateModal } from '@/components/prediction/RenegotiateModal';
import { PositiveRecapModal } from '@/components/positive/PositiveRecapModal';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { EvidenceLogView } from '@/components/evidence/EvidenceLogView';
import { DebtLedgerView } from '@/components/debt/DebtLedgerView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { NewTaskModal } from '@/components/task/NewTaskModal';
import { NotificationSettingsModal } from '@/components/settings/NotificationSettingsModal';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { RippleAssistantChatbot } from '@/components/chat/RippleAssistantChatbot';
import { FloatingTimerWidget } from '@/components/timer/FloatingTimerWidget';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Task } from '@/types/ripple';
import { Shield, Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RippleAppContent: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isAdminView,
    setAdminView,
    impersonatedUser,
    startImpersonatingUser,
    exitImpersonatedUser,
    activeTaskForPrediction,
    activeFocusTask,
    completedTaskForCelebration,
    isNotificationModalOpen,
    setNotificationModalOpen,
    setActiveTaskForPrediction,
    setActiveFocusTask,
    setCompletedTaskForCelebration
  } = useRipple();

  const [activeTab, setActiveTab] = useState('warroom');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [renegotiateTask, setRenegotiateTask] = useState<Task | null>(null);

  if (!currentUser) {
    return <AuthPage />;
  }

  // Render Admin Dashboard if Admin View active
  if (isAdmin && isAdminView) {
    return (
      <AdminLayout
        onExitAdmin={() => setAdminView(false)}
        onImpersonateUser={(u) => startImpersonatingUser(u)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white relative">
      {/* Sticky Support Mode / Impersonation Banner */}
      {impersonatedUser && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-500/50 px-4 py-2 text-white flex items-center justify-between text-xs sticky top-0 z-50 shadow-xl">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300">SUPPORT MODE (ADMIN VIEW):</span>
            <span className="text-slate-200">
              Inspecting application as <strong className="text-white font-mono">{impersonatedUser.name} ({impersonatedUser.email})</strong>
            </span>
          </div>

          <Button
            size="sm"
            onClick={exitImpersonatedUser}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-7 px-3 gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit User View
          </Button>
        </div>
      )}

      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28">
        {activeTab === 'warroom' && (
          <WarRoom
            onOpenPrediction={(t) => setActiveTaskForPrediction(t)}
            onOpenFocus={(t) => setActiveFocusTask(t)}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          />
        )}

        {activeTab === 'study' && <StudyTrackerView />}

        {activeTab === 'calendar' && (
          <CalendarView
            onOpenPrediction={(t) => setActiveTaskForPrediction(t)}
            onOpenFocus={(t) => setActiveFocusTask(t)}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          />
        )}

        {activeTab === 'timetable' && <TimetableGrid />}

        {activeTab === 'evidence' && <EvidenceLogView />}

        {activeTab === 'debt' && <DebtLedgerView />}
      </main>

      {/* Floating Minimizable Background Timer Widget */}
      <FloatingTimerWidget />

      {/* Interactive AI Assistant Chatbot */}
      <RippleAssistantChatbot />

      {/* Single Detailed Step-by-Step Tutorial Overlay */}
      <TutorialOverlay onTabChange={(tab) => setActiveTab(tab)} />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />

      {/* Modals & Overlays */}
      <PredictionView
        task={activeTaskForPrediction}
        onClose={() => setActiveTaskForPrediction(null)}
        onOpenFocus={(t) => setActiveFocusTask(t)}
        onOpenRenegotiate={(t) => setRenegotiateTask(t)}
      />

      <FocusModeModal
        task={activeFocusTask}
        onClose={() => setActiveFocusTask(null)}
      />

      <RenegotiateModal
        task={renegotiateTask}
        onClose={() => setRenegotiateTask(null)}
      />

      <PositiveRecapModal
        task={completedTaskForCelebration}
        onClose={() => setCompletedTaskForCelebration(null)}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </div>
  );
};

export default function Index() {
  return (
    <RippleProvider>
      <RippleAppContent />
    </RippleProvider>
  );
}