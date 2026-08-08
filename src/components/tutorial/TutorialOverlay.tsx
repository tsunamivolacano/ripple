import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  Zap, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Flame, 
  Calendar, 
  FileText, 
  TrendingDown, 
  Play, 
  CheckCircle2, 
  Target,
  Lightbulb,
  Plus,
  Bot,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface TutorialStep {
  id: string;
  targetSelector?: string;
  tabTarget?: 'warroom' | 'timetable' | 'evidence' | 'debt' | 'calendar';
  title: string;
  subtitle: string;
  description: string;
  keyConcepts: string[];
  actionStep: string;
  icon: React.ElementType;
  iconColor: string;
  badgeText: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    tabTarget: 'warroom',
    title: 'Welcome to RIPPLE v2.0',
    subtitle: 'Step 1 of 11: Core Consequence Engine',
    description: 'RIPPLE transforms tasks into real-time consequence risk forecasts that factor in human strictness, teacher habits, and personal energy costs before panic sets in.',
    keyConcepts: [
      'Multi-Ring Doomsday Gauges calculate real-time buffer ratios.',
      'Human Context Matrix factors in teacher strictness habits.',
      'Split-Timeline Simulator compares Start Now vs. Delay 2 Hours.'
    ],
    actionStep: 'Look at the War Room grid where active tasks and risk dials are displayed.',
    icon: Zap,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 1/11: Overview'
  },
  {
    id: 'intensity',
    targetSelector: '[data-tour="intensity-mode"]',
    tabTarget: 'warroom',
    title: 'AI Prediction Intensity Modes',
    subtitle: 'Step 2 of 11: Urgency Framing Switcher',
    description: 'Look at the highlighted badge at the top navbar. You can switch between Coach Mode (gentle), Standard Mode (balanced), and Doomsday Mode (high-urgency narratives).',
    keyConcepts: [
      'Coach Mode: Gentle, supportive micro-goals when feeling overwhelmed.',
      'Standard Mode: Objective, balanced realism.',
      'Doomsday Mode: High-stakes second-person narratives to break deadline paralysis.'
    ],
    actionStep: 'Click the highlighted top header badge anytime to adjust AI urgency framing.',
    icon: Flame,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 2/11: Intensity Modes'
  },
  {
    id: 'warroom_gauge',
    targetSelector: '[data-tour="gauge-element"]',
    tabTarget: 'warroom',
    title: 'The Multi-Ring Doomsday Gauge',
    subtitle: 'Step 3 of 11: Real-Time Buffer Dial',
    description: 'Look at the highlighted gauge on the task card. The outer ring displays your remaining time buffer ratio (Time Left ÷ Work Required).',
    keyConcepts: [
      'Outer Ring (Time Buffer): Green (> 3.0x), Yellow (1.5x - 3.0x), Red (< 1.5x).',
      'Middle Ring: Academic grade weight & teacher strictness penalty.',
      'Inner Ring: Sleep & physical energy disruption score.'
    ],
    actionStep: 'Observe the color-coded rings on your task cards in the War Room grid.',
    icon: Target,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 3/11: Risk Dials'
  },
  {
    id: 'predict_btn',
    targetSelector: '[data-tour="predict-btn"]',
    tabTarget: 'warroom',
    title: 'Predict Consequence & Split Timelines',
    subtitle: 'Step 4 of 11: AI Scenario Engine',
    description: 'Look at the highlighted "Predict Consequence" button. Clicking it launches the Split-Timeline simulator, comparing Timeline A (Start Now) vs. Timeline B (Delay 2 Hours).',
    keyConcepts: [
      'Timeline A (Start Now): Protected grades, zero debt, and free evening downtime.',
      'Timeline B (Delay 2 Hours): Late-night panic cascade and fatigue penalties.',
      'Honest Renegotiation: Extend deadlines (+12h, +24h, +48h) with an honest reason.'
    ],
    actionStep: 'Click "Predict Consequence" on any task to view branching outcomes.',
    icon: Sparkles,
    iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'Step 4/11: Split Timelines'
  },
  {
    id: 'start_btn',
    targetSelector: '[data-tour="start-btn"]',
    tabTarget: 'warroom',
    title: 'Focus Sprint Mode & Counter-Loops',
    subtitle: 'Step 5 of 11: Beating the Doomsday Clock',
    description: 'Look at the highlighted "Start Now" button. It opens Focus Mode with a 25-minute Pomodoro sprint timer and a live completion percentage slider.',
    keyConcepts: [
      '25-Minute Focus Timer: Execute focused work blocks.',
      'Live Progress Slider: Update completion percentage in real time.',
      'Positive Counter-Loop: Celebrate avoided consequences upon completion!'
    ],
    actionStep: 'Click "Start Now" on any task card to launch a focus sprint.',
    icon: Play,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 5/11: Focus Sprints'
  },
  {
    id: 'new_task',
    targetSelector: '[data-tour="new-task-btn"]',
    tabTarget: 'warroom',
    title: 'Creating New Tasks & Activities',
    subtitle: 'Step 6 of 11: Adding Tasks',
    description: 'Look at the highlighted "+ New Task" button in the top navbar. Add academic assignments or personal activities like appointments, checkups, or meetings.',
    keyConcepts: [
      'Academic Tasks: Link to specific timetable classes for strictness tracking.',
      'Personal Activities: Track appointments, chores, or reminders.',
      'Dynamic Deadlines: Set deadline by hours left or explicit date/time.'
    ],
    actionStep: 'Click "+ New Task" to add a new task or activity anytime.',
    icon: Plus,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 6/11: New Task'
  },
  {
    id: 'timetable_tab',
    targetSelector: '[data-tour="timetable-tab"]',
    tabTarget: 'timetable',
    title: 'Timetable & Human Context Matrix',
    subtitle: 'Step 7 of 11: Teacher Strictness Tags',
    description: 'Look at the highlighted "Timetable & Context" tab. Configure your weekly schedule and tag instructors with real human behavior habits.',
    keyConcepts: [
      'Strictness Tags: Spot Cold-Calls, Checks Notebook Copies, Strict Locks Doors.',
      'Stakes Tags: Graded Quiz, Notebook Copy, Lab Practical, Presentation.',
      'Grade Weight: Set class percentage weight for accurate risk priority.'
    ],
    actionStep: 'Click "+ Add Timetable Slot" to add a class with custom strictness tags.',
    icon: Calendar,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 7/11: Human Context'
  },
  {
    id: 'evidence_tab',
    targetSelector: '[data-tour="evidence-tab"]',
    tabTarget: 'evidence',
    title: 'Evidence Case File Log',
    subtitle: 'Step 8 of 11: Calibrating AI Accuracy',
    description: 'Look at the highlighted "Evidence Case File" tab. Log real-world outcomes after deadlines pass to help RIPPLE calibrate its personal velocity multiplier.',
    keyConcepts: [
      'Post-Deadline Logging: Record whether you handed in work on time.',
      '1-5 Star Accuracy Rating: Rate AI forecast accuracy.',
      'Personal Velocity Multiplier: Automatically corrects for realistic work pace.'
    ],
    actionStep: 'Click "Log Post-Deadline Outcome" to record your first case file entry.',
    icon: FileText,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 8/11: Evidence Log'
  },
  {
    id: 'debt_tab',
    targetSelector: '[data-tour="debt-tab"]',
    tabTarget: 'debt',
    title: 'Procrastination Debt Ledger',
    subtitle: 'Step 9 of 11: Monitoring Backlog',
    description: 'Look at the highlighted "Debt Ledger" tab. Track compounding task backlog, total hours behind schedule, missed deadline counts, and 7-day accumulation trends.',
    keyConcepts: [
      'Compounding Score (0-100): Reflects your total task delay liability.',
      '7-Day Debt Trend: Visualizes daily debt hour accumulation.',
      'Debt Recovery: Clear debt score points by completing focus sprints.'
    ],
    actionStep: 'Keep your debt compounding score low to preserve peak momentum.',
    icon: TrendingDown,
    iconColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    badgeText: 'Step 9/11: Debt Ledger'
  },
  {
    id: 'calendar_tab',
    targetSelector: '[data-tour="calendar-tab"]',
    tabTarget: 'calendar',
    title: 'Live Calendar & Timezone Sync',
    subtitle: 'Step 10 of 11: Integrated Schedule',
    description: 'Look at the highlighted "Live Calendar" tab. View your timetable classes and task deadlines integrated in your device\'s local timezone.',
    keyConcepts: [
      'Month / Week / Day Views: Toggle schedule perspectives.',
      'Filter Controls: Filter between Tasks vs. Classes.',
      'Timezone Sync: Automatically formatted in your device local time.'
    ],
    actionStep: 'Explore Month, Week, and Day calendar views anytime.',
    icon: CalendarDays,
    iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'Step 10/11: Calendar'
  },
  {
    id: 'ai_chatbot',
    targetSelector: '[data-tour="ai-chatbot"]',
    tabTarget: 'warroom',
    title: 'RIPPLE AI Assistant Chatbot',
    subtitle: 'Step 11 of 11: On-Demand Answers',
    description: 'Look at the highlighted AI Assistant button at the bottom-right corner. Ask any question about Doomsday Gauges, Debt Scores, or Intensity Modes anytime!',
    keyConcepts: [
      'Instant Knowledge Base: Answers all app questions.',
      'Interactive Guide Launcher: Restart this step-by-step tour anytime.',
      'Quick Action Chips: One-tap answers for popular questions.'
    ],
    actionStep: 'Click the AI Assistant button anytime you need quick answers!',
    icon: Bot,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 11/11: AI Assistant'
  }
];

interface TutorialOverlayProps {
  onTabChange?: (tab: string) => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onTabChange }) => {
  const {
    isTutorialOpen,
    currentTutorialStep,
    setTutorialStep,
    closeTutorial,
    completeTutorial
  } = useRipple();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TUTORIAL_STEPS[currentTutorialStep] || TUTORIAL_STEPS[0];
  const totalSteps = TUTORIAL_STEPS.length;
  const progressPercent = Math.round(((currentTutorialStep + 1) / totalSteps) * 100);

  // Auto switch dashboard tabs based on step
  useEffect(() => {
    if (isTutorialOpen && currentStep.tabTarget && onTabChange) {
      onTabChange(currentStep.tabTarget);
    }
  }, [isTutorialOpen, currentTutorialStep, currentStep, onTabChange]);

  // Update highlighted target bounding rect
  useLayoutEffect(() => {
    if (!isTutorialOpen) return;

    const updateRect = () => {
      if (currentStep.targetSelector) {
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();
    const timer = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isTutorialOpen, currentTutorialStep, currentStep]);

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

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Subtle Semi-Transparent Background (Leaves underlying app fully visible) */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-all duration-300" />

      {/* Dynamic Highlight Ring Spotlight Box around target component */}
      {targetRect && (
        <div
          className="fixed pointer-events-none border-2 border-rose-500 rounded-2xl shadow-[0_0_35px_rgba(244,63,94,0.8)] animate-pulse transition-all duration-300 z-50"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12
          }}
        />
      )}

      {/* Sleek Compact Docked Tutorial Bar (Bottom Center) - Does not block app content */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-xl pointer-events-auto">
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-5 text-white backdrop-blur-md space-y-3 border-t-2 border-t-rose-500">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${currentStep.iconColor} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white leading-tight">
                  {currentStep.title}
                </h3>
                <span className="text-[10px] font-semibold text-rose-300 font-mono">
                  {currentStep.subtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-950 text-rose-300 border-rose-500/40 text-[10px] font-mono">
                {currentStep.badgeText}
              </Badge>
              <button
                onClick={closeTutorial}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                title="Exit Tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Concise Description */}
          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            {currentStep.description}
          </p>

          {/* Action Step Note */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{currentStep.actionStep}</span>
          </div>

          {/* Progress & Navigation Bar */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-[140px] space-y-1">
              <Progress value={progressPercent} className="h-1.5 bg-slate-950 [&>div]:bg-rose-500" />
              <span className="text-[9px] text-slate-400 font-mono block text-center">{progressPercent}% Completed</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeTutorial}
                className="text-slate-400 hover:text-white text-xs h-8 px-2"
              >
                Skip
              </Button>

              {currentTutorialStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8 px-2.5 gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 px-4 gap-1 shadow-md shadow-rose-950"
              >
                <span>{currentTutorialStep === totalSteps - 1 ? 'Finish Tour' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};