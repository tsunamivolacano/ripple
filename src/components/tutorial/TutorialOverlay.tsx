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
  tip?: string;
  icon: React.ElementType;
  iconColor: string;
  badgeText: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    tabTarget: 'warroom',
    title: 'Welcome to RIPPLE v2.0',
    subtitle: 'Step 1 of 11: Core Consequence Engine Philosophy',
    description: 'Traditional task managers treat due dates as abstract timestamps. RIPPLE transforms tasks into real-time consequence risk forecasts that factor in human strictness, teacher habits, and personal energy costs before panic sets in.',
    keyConcepts: [
      'Multi-Ring Doomsday Gauges calculate real-time buffer ratios.',
      'Human Context Matrix factors in teacher habits like spot cold-calls or strict deadline enforcement.',
      'Split-Timeline Simulator compares Timeline A (Start Now) vs. Timeline B (Delay 2 Hours) side-by-side.'
    ],
    actionStep: 'Explore the War Room dashboard where your active tasks and risk dials are displayed.',
    tip: 'RIPPLE measures how delaying a task today impacts your sleep, grades, and peace of mind tomorrow.',
    icon: Zap,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 1/11: Overview'
  },
  {
    id: 'intensity',
    targetSelector: '[data-tour="intensity-mode"]',
    tabTarget: 'warroom',
    title: 'AI Prediction Intensity Modes',
    subtitle: 'Step 2 of 11: Tailoring Urgency Framing to Your Mental State',
    description: 'Click the mode badge in the top navigation bar at any time to switch between 3 distinct AI framing styles depending on your focus state.',
    keyConcepts: [
      'Coach Mode: Gentle, supportive micro-goals and positive reinforcement. Ideal when feeling overwhelmed or burned out.',
      'Standard Mode: Balanced, objective realism detailing timeline and grade consequences calmly.',
      'Doomsday Mode: Urgent, high-stakes second-person narratives designed to shatter deadline paralysis.'
    ],
    actionStep: 'Look at the highlighted badge at the top header to change urgency settings anytime.',
    icon: Flame,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 2/11: Intensity Modes'
  },
  {
    id: 'warroom_gauge',
    targetSelector: '[data-tour="gauge-element"]',
    tabTarget: 'warroom',
    title: 'The Multi-Ring Doomsday Gauge',
    subtitle: 'Step 3 of 11: Visualizing Time Buffers Before Panic',
    description: 'Each task card features a multi-ring Doomsday Gauge. Unlike static deadlines, this dial visually computes your safety buffer ratio (Time Left ÷ Work Required).',
    keyConcepts: [
      'Outer Ring (Time Buffer): Green = Manageable (> 3.0x), Yellow = Tight (1.5x - 3.0x), Red = Critical (< 1.5x).',
      'Middle Ring (Academic Risk): Measures grade percentage weight and teacher strictness penalty.',
      'Inner Ring (Sleep & Physical Penalty): Shows estimated late-night fatigue and rest disruption.'
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
    subtitle: 'Step 4 of 11: AI Scenario Engine & Honest Exit',
    description: 'Clicking "Predict Consequence" on any task card runs a live AI simulation. The Split-Timeline simulator displays your two possible futures side-by-side.',
    keyConcepts: [
      'Timeline A (Start Now): Highlights avoided stress, protected grades, and uninterrupted downtime.',
      'Timeline B (Delay 2 Hours): Displays the cascade of late-night rushing, fatigue, and teacher friction.',
      'Honest Renegotiation: Need an extension? Reset your buffer with an honest reason (+12h, +24h, +48h) instead of ghosting deadlines.'
    ],
    actionStep: 'Click "Predict Consequence" on any task card to inspect its branching scenario breakdown.',
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
    description: 'Clicking "Start Now" launches Focus Mode. Use the built-in 25-minute Pomodoro timer and update your completion progress with the live slider.',
    keyConcepts: [
      '25-Minute Sprint Timer: Focus on one micro-task block at a time.',
      'Live Progress Slider: Adjust completion percentage as you work.',
      'Positive Counter-Loop: Completing a task triggers a celebration modal summarizing avoided consequences and gained confidence!'
    ],
    actionStep: 'Click "Start Now" on any task to test the Pomodoro focus sprint view.',
    icon: Play,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 5/11: Focus Sprints'
  },
  {
    id: 'new_task',
    targetSelector: '[data-tour="new-task-btn"]',
    tabTarget: 'warroom',
    title: 'Creating New Tasks & Activities',
    subtitle: 'Step 6 of 11: Adding Academic & Personal Goals',
    description: 'Click the "+ New Task" button in the top navbar at any time to add new assignments, personal goals, meetings, or checkups.',
    keyConcepts: [
      'Academic Tasks: Link to specific timetable classes for teacher strictness tracking.',
      'Personal Activities: Track appointments, chores, meetings, or reminders.',
      'Dynamic Deadlines: Set deadline by hours left or explicit date & time.'
    ],
    actionStep: 'Click "+ New Task" to add a new activity to your schedule.',
    icon: Plus,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 6/11: New Task'
  },
  {
    id: 'timetable_tab',
    targetSelector: '[data-tour="timetable-tab"]',
    tabTarget: 'timetable',
    title: 'Timetable & Human Context Matrix',
    subtitle: 'Step 7 of 11: Factoring Teacher Strictness',
    description: 'Switching to "Timetable & Context" lets you configure your weekly schedule and tag instructors with real human behavior traits.',
    keyConcepts: [
      'Strictness Tags: "Spot Cold-Calls", "Checks Notebook Copies", "Strict Locks Doors", or "Public Scolder".',
      'Stakes Tags: "Graded Quiz", "Notebook Copy", "Lab Practical", or "Presentation".',
      'Grade Weight: Set percentage weight so high-value tasks receive higher risk priority.'
    ],
    actionStep: 'Click "+ Add Timetable Slot" to add a new class with custom start and end times!',
    icon: Calendar,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 7/11: Human Context'
  },
  {
    id: 'evidence_tab',
    targetSelector: '[data-tour="evidence-tab"]',
    tabTarget: 'evidence',
    title: 'Evidence Case File Log',
    subtitle: 'Step 8 of 11: Calibrating AI Accuracy Against Reality',
    description: 'Visit the "Evidence Case File" tab after deadlines pass to log real-world outcomes and rate AI forecast accuracy from 1 to 5 stars.',
    keyConcepts: [
      'Post-Deadline Logging: Record whether you submitted on time or experienced teacher feedback.',
      'Accuracy Rating: Rate AI predictions to help RIPPLE learn your pacing.',
      'Personal Velocity Multiplier: Automatically adjusts estimated work time if tasks take 20% longer than planned.'
    ],
    actionStep: 'Click "Log Post-Deadline Outcome" to save your first case file entry.',
    icon: FileText,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 8/11: Evidence Log'
  },
  {
    id: 'debt_tab',
    targetSelector: '[data-tour="debt-tab"]',
    tabTarget: 'debt',
    title: 'Procrastination Debt Ledger',
    subtitle: 'Step 9 of 11: Monitoring Backlog & Recovery',
    description: 'The "Debt Ledger" tab tracks compounding task backlog, total hours behind schedule, missed deadline counts, and 7-day accumulation trends.',
    keyConcepts: [
      'Compounding Score (0-100): Reflects your total task delay liability.',
      '7-Day Debt Trend: Visualizes daily debt hour accumulation.',
      'Recovery Action: Execute short catch-up sprints or switch to Coach Mode to clear debt points.'
    ],
    actionStep: 'Keep your debt compounding score below 40 to preserve peak focus and zero guilt!',
    icon: TrendingDown,
    iconColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    badgeText: 'Step 9/11: Debt Ledger'
  },
  {
    id: 'calendar_tab',
    targetSelector: '[data-tour="calendar-tab"]',
    tabTarget: 'calendar',
    title: 'Live Calendar & Timezone Sync',
    subtitle: 'Step 10 of 11: Integrated Local Schedule View',
    description: 'The "Live Calendar" tab combines your timetable classes and task deadlines in your device\'s local timezone with Month, Week, and Day views.',
    keyConcepts: [
      'Month / Week / Day Views: Switch perspectives seamlessly.',
      'Filter Controls: Toggle between Tasks, Classes, or All Activities.',
      'Local Timezone Sync: Automatically displays dates in your device local time.'
    ],
    actionStep: 'Click the Live Calendar tab to view your integrated weekly schedule.',
    icon: CalendarDays,
    iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'Step 10/11: Calendar'
  },
  {
    id: 'ai_chatbot',
    targetSelector: '[data-tour="ai-chatbot"]',
    tabTarget: 'warroom',
    title: 'RIPPLE AI Assistant Chatbot',
    subtitle: 'Step 11 of 11: On-Demand Answers & Guidance',
    description: 'Need help or have a question at any time? Click the floating AI Assistant button in the bottom right corner of your screen.',
    keyConcepts: [
      'Instant Knowledge Base: Asks about Doomsday Gauges, Intensity Modes, or Debt Scores.',
      'Interactive Guide Launcher: Easily restart this step-by-step tour anytime.',
      'Quick Action Chips: One-tap answers for popular questions.'
    ],
    actionStep: 'Click the bottom-right AI Assistant button to test asking a question!',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Dynamic Highlight Ring Spotlight Box */}
      {targetRect && (
        <div
          className="fixed pointer-events-none border-2 border-rose-500 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-pulse transition-all duration-300 z-50"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
          }}
        />
      )}

      {/* Main Walkthrough Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between text-white p-6 sm:p-8 space-y-6 z-50 animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <Badge variant="outline" className="bg-slate-950/90 border-slate-700 text-rose-300 text-xs px-3 py-1 font-mono">
              {currentStep.badgeText}
            </Badge>

            <button
              onClick={closeTutorial}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Skip & Exit Tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 font-mono">
              <span>Interactive Guide Progress</span>
              <span className="text-rose-400 font-extrabold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-slate-950 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:via-purple-500 [&>div]:to-indigo-500" />
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 my-1">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border shrink-0 ${currentStep.iconColor} shadow-lg`}>
              <Icon className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-xs font-bold text-rose-300 mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            {currentStep.description}
          </p>

          {/* Key Concepts Bullet List */}
          {currentStep.keyConcepts && currentStep.keyConcepts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Key Features & Takeaways:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                {currentStep.keyConcepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Step Box */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300 block text-[11px] uppercase tracking-wide">Next Action Step:</span>
              <p className="text-[11px] leading-snug">{currentStep.actionStep}</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={closeTutorial}
            className="text-slate-400 hover:text-white text-xs px-3"
          >
            Skip Tutorial
          </Button>

          <div className="flex items-center gap-2">
            {currentTutorialStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 px-6 shadow-lg shadow-rose-950"
            >
              <span>{currentTutorialStep === totalSteps - 1 ? 'Finish & Explore RIPPLE' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};