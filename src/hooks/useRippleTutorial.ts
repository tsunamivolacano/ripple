import { useState } from 'react';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { showSuccess } from '@/utils/toast';
import { UserAccount } from './useRippleAuth';

export function useRippleTutorial(currentUser: UserAccount | null) {
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean>(() => {
    if (!currentUser) return false;
    return safeGetStorage(`ripple_tutorial_completed_${currentUser.id}`, false);
  });

  const startTutorial = () => {
    setCurrentTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const replayTutorial = () => {
    setCurrentTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  const completeTutorial = () => {
    setHasCompletedTutorial(true);
    setIsTutorialOpen(false);
    if (currentUser) {
      safeSetStorage(`ripple_tutorial_completed_${currentUser.id}`, true);
    }
    showSuccess('Tutorial completed!');
  };

  const setTutorialStep = (step: number) => {
    setCurrentTutorialStep(step);
  };

  return {
    isTutorialOpen,
    currentTutorialStep,
    hasCompletedTutorial,
    setHasCompletedTutorial,
    startTutorial,
    replayTutorial,
    closeTutorial,
    completeTutorial,
    setTutorialStep
  };
}