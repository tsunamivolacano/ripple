"use client";

import React, { useState } from 'react';
import { RippleProvider, useRipple } from '@/context/RippleContext';
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

const RippleAppContent: React.FC = () => {
  const {
    activeTaskForPrediction,
    activeFocusTask,
    completedTaskForCelebration,
    setActiveTaskForPrediction,
    setActiveFocusTask,
    setCompletedTaskForCelebration
  } = useRipple();

  const [activeTab, setActiveTab] = useState('warroom');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [renegotiateTask, setRenegotiateTask] = useState<Task | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {activeTab === 'warroom' && (
          <WarRoom
            onOpenPrediction={(t) => setActiveTaskForPrediction(t)}
            onOpenFocus={(t) => setActiveFocusTask(t)}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          />
        )}

        {activeTab === 'timetable' && <TimetableGrid />}

        {activeTab === 'evidence' && <EvidenceLogView />}

        {activeTab === 'debt' && <DebtLedgerView />}
      </main>

      {/* Footer Branding - Removed MadeWithDyad */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4">
      </footer>

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