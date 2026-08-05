import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRipple } from '@/context/RippleContext';
import { Navbar } from '@/components/header/Navbar';
import { WarRoom } from '@/components/doomsday/WarRoom';
import { PredictionView } from '@/components/prediction/PredictionView';
import { FocusModeModal } from '@/components/prediction/FocusModeModal';
import { RenegotiateModal } from '@/components/prediction/RenegotiateModal';
import { PositiveRecapModal } from '@/components/positive/PositiveRecapModal';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { EvidenceLogView } from '@/components/evidence/EvidenceLogView';
import { DebtLedgerView } from '@/components/debt/DebtLedgerView';
import { NewTaskModal } from '@/components/task/NewTaskModal';
import { Task } from '@/types/ripple';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Zap } from 'lucide-react';

interface IndexProps {
  initialTab?: string;
}

export default function Index({ initialTab = 'warroom' }: IndexProps) {
  const navigate = useNavigate();
  const {
    user,
    isLoadingAuth,
    activeTaskForPrediction,
    activeFocusTask,
    completedTaskForCelebration,
    setActiveTaskForPrediction,
    setActiveFocusTask,
    setCompletedTaskForCelebration
  } = useRipple();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [renegotiateTask, setRenegotiateTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate('/login');
    }
  }, [user, isLoadingAuth, navigate]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-500 flex items-center justify-center animate-pulse shadow-xl shadow-rose-900/20">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <p className="text-slate-400 text-xs font-mono tracking-widest uppercase">Initializing Ripple...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {activeTab === 'warroom' && (
          <WarRoom
            onOpenPrediction={(t) => setActiveTaskForPrediction(t)}
            onOpenFocus={(t) => setActiveFocusTask(t)}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            onGoToTimetable={() => setActiveTab('timetable')}
          />
        )}

        {activeTab === 'timetable' && <TimetableGrid />}
        {activeTab === 'evidence' && <EvidenceLogView />}
        {activeTab === 'debt' && <DebtLedgerView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4">
        <MadeWithDyad />
      </footer>

      <PredictionView
        task={activeTaskForPrediction}
        onClose={() => setActiveTaskForPrediction(null)}
        onOpenFocus={(t) => setActiveFocusTask(t)}
        onOpenRenegotiate={(t) => setRenegotiateTask(t)}
      />
      <FocusModeModal task={activeFocusTask} onClose={() => setActiveFocusTask(null)} />
      <RenegotiateModal task={renegotiateTask} onClose={() => setRenegotiateTask(null)} />
      <PositiveRecapModal task={completedTaskForCelebration} onClose={() => setCompletedTaskForCelebration(null)} />
      <NewTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} />
    </div>
  );
}