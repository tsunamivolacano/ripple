import React, { useEffect, useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Flame, 
  Calendar, 
  FileText, 
  TrendingDown, 
  Play, 
  Plus,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface TourStep {
  id: string;
  tabTarget: 'warroom' | 'timetable' | 'evidence' | 'debt';
  targetSelector: string;
  title: string;
  subtitle: string;
  description: string;
  tip?: string;
  example?: string;
  icon: React.ElementType;
  badgeText: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intensity',
    tabTarget: 'warroom',
    targetSelector: '[data-tour="intensity-mode"]',
    title: 'AI Prediction Intensity',
    subtitle: 'Header Urgency Mode Selector',
    description: 'Switch between Coach (gentle), Standard (balanced), and Doomsday (high urgency) framing to match your current focus level.',
    tip: 'Toggle to Coach Mode whenever you feel overwhelmed.',
    icon: Flame,
    badgeText: 'Step 1 of 8: Urgency Control'
  },
  {
    id: 'gauge',
    tabTarget: 'warroom',
    targetSelector: '[data-tour="gauge-element"]',
    title: 'Multi-Ring Doomsday Gauge',
    subtitle: 'Visual Risk Dial',
    description: 'The outer ring tracks your remaining time buffer. Inner rings monitor academic risk and sleep penalties before they occur.',
    example: 'When the buffer ratio drops below 1.5x, the ring turns red and pulses!',
    icon: Target,
    badgeText: 'Step 2 of 8: Multi-Ring Dial'
  },
  {
    id: 'predict',
    tabTarget: 'warroom',
    targetSelector: '[data-tour="predict-btn"]',
    title: 'Predict Consequence Button',
    subtitle: 'Scenario Engine',
    description: 'Click this to run a live AI simulation. Compare Timeline A (Start Now) vs Timeline B (Delay 2 Hours) side-by-side.',
    tip: 'Allows renegotiating deadlines if you underestimate task hours.',
    icon: Sparkles,
    badgeText: 'Step 3 of 8: Consequence Forecast'
  },
  {
    id: 'start-now',
    tabTarget: 'warroom',
    targetSelector: '[data-tour="start-btn"]',
    title: 'Start Now & Focus Sprint',
    subtitle: 'Pomodoro Sprint Mode',
    description: 'Launches a 25-minute Pomodoro sprint modal with a live progress slider to beat the Doomsday clock.',
    icon: Play,
    badgeText: 'Step 4 of 8: Focus Sprint'
  },
  {
    id: 'new-task',
    tabTarget: 'warroom',
    targetSelector: '[data-tour="new-task-btn"]',
    title: 'Add New Task',
    subtitle: 'War Room Integration',
    description: 'Add new assignments and link them directly to your timetable slots, teacher strictness habits, and grade weights.',
    icon: Plus,
    badgeText: 'Step 5 of 8: Task Creation'
  },
  {
    id: 'timetable',
    tabTarget: 'timetable',
    targetSelector: '[data-tour="timetable-section"]',
    title: 'Timetable & Human Context Matrix',
    subtitle: 'Teacher Behavior Tags',
    description: 'Configure your weekly classes and tag teachers with behavioral traits like "Spot Cold-Calls" or "Notebook Checker".',
    tip: 'Strict teachers automatically increase task risk scores!',
    icon: Calendar,
    badgeText: 'Step 6 of 8: Human Context'
  },
  {
    id: 'evidence',
    tabTarget: 'evidence',
    targetSelector: '[data-tour="evidence-section"]',
    title: 'Evidence Case File Log',
    subtitle: 'Reality vs Prediction',
    description: 'Log real-world deadline outcomes to rate AI forecast accuracy (1-5 stars) and calibrate your task velocity.',
    icon: FileText,
    badgeText: 'Step 7 of 8: Calibration'
  },
  {
    id: 'debt',
    tabTarget: 'debt',
    targetSelector: '[data-tour="debt-section"]',
    title: 'Procrastination Debt Ledger',
    subtitle: 'Compounding Backlog',
    description: 'Monitors total hours behind schedule, missed deadlines, and weekly accumulation trends.',
    tip: 'Keep your score below 40 to preserve peak focus.',
    icon: TrendingDown,
    badgeText: 'Step 8 of 8: Debt Ledger'
  }
];

interface ProductTourProps {
  onTabChange: (tab: string) => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ onTabChange }) => {
  const {
    isTutorialOpen,
    currentTutorialStep,
    setTutorialStep,
    closeTutorial,
    completeTutorial
  } = useRipple();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = TOUR_STEPS[currentTutorialStep] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;

  // Sync tab with step target and locate target DOM element
  useEffect(() => {
    if (!isTutorialOpen) return;

    if (currentStep.tabTarget) {
      onTabChange(currentStep.tabTarget);
    }

    const updateRect = () => {
      let element = document.querySelector(currentStep.targetSelector);
      
      if (!element && currentStep.id === 'gauge') {
        element = document.querySelector('[data-tour="task-card"]');
      }

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        setTimeout(() => {
          setTargetRect(element!.getBoundingClientRect());
        }, 150);
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timer = setTimeout(updateRect, 200);

    const handleResize = () => updateRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isTutorialOpen, currentTutorialStep, currentStep, onTabChange]);

  if (!isTutorialOpen) return null;

  const Icon = currentStep.icon;

  const handleNext = () => {
    if (currentTutorialStep < totalSteps - 1) {
      setTutorialStep(currentTutorialStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleBack = () => {
    if (currentTutorialStep > 0) {
      setTutorialStep(currentTutorialStep - 1);
    }
  };

  // Calculate popover positioning relative to targetRect
  let popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 60
  };

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow > 280) {
      popoverStyle = {
        position: 'fixed',
        top: Math.min(window.innerHeight - 300, targetRect.bottom + 16),
        left: Math.max(16, Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 180)),
        zIndex: 60
      };
    } else if (spaceAbove > 280) {
      popoverStyle = {
        position: 'fixed',
        top: Math.max(16, targetRect.top - 290),
        left: Math.max(16, Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 180)),
        zIndex: 60
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* SVG Mask Spotlight cutout over targeted UI element */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Semi-transparent dark overlay */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.82)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Pulsing glow ring around spotlighted element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            zIndex: 55
          }}
        />
      )}

      {/* Popover Step Card */}
      <div
        style={popoverStyle}
        className="w-[90vw] max-w-[380px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[11px] font-mono">
            {currentStep.badgeText}
          </Badge>

          <button
            onClick={closeTutorial}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{currentStep.title}</h3>
            <span className="text-[11px] font-semibold text-rose-300">{currentStep.subtitle}</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          {currentStep.description}
        </p>

        {currentStep.tip && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{currentStep.tip}</span>
          </div>
        )}

        {/* Navigation Toolbar */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeTutorial}
            className="text-slate-400 hover:text-white text-xs px-2 h-8"
          >
            Skip
          </Button>

          <div className="flex items-center gap-2">
            {currentTutorialStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs gap-1 h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1 px-4 h-8"
            >
              <span>{currentTutorialStep === totalSteps - 1 ? 'Finish Tour' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};