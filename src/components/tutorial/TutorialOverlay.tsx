import React, { useEffect } from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  Zap, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  HelpCircle, 
  Flame, 
  Calendar, 
  FileText, 
  TrendingDown, 
  Play, 
  CheckCircle2, 
  Target,
  GraduationCap,
  AlertTriangle,
  Lightbulb,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface TutorialStep {
  id: string;
  tabTarget?: 'warroom' | 'timetable' | 'evidence' | 'debt';
  title: string;
  subtitle: string;
  description: string;
  keyConcepts: string[];
  actionStep: string;
  tip?: string;
  example?: string;
  icon: React.ElementType;
  iconColor: string;
  badgeText: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    tabTarget: 'warroom',
    title: 'Welcome to RIPPLE v2.0',
    subtitle: 'Step 1: Why Traditional Todo Lists Fail',
    description: 'Traditional task managers treat due dates as abstract timestamps. RIPPLE transforms tasks into real-time consequence risk forecasts that factor in human strictness, teacher habits, and personal energy costs before panic sets in.',
    keyConcepts: [
      'Multi-Ring Doomsday Gauges calculate real-time buffer ratios.',
      'Human Context Matrix factors in teacher habits like spot cold-calls or strict deadline enforcement.',
      'Split-Timeline Simulator compares Timeline A (Start Now) vs. Timeline B (Delay 2 Hours) side-by-side.'
    ],
    actionStep: 'Look at the War Room dashboard where your active tasks and risk dials are displayed.',
    tip: 'RIPPLE measures how delaying a task today impacts your sleep, grades, and peace of mind tomorrow.',
    icon: Zap,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 1 of 8: Core Philosophy'
  },
  {
    id: 'intensity',
    tabTarget: 'warroom',
    title: 'AI Prediction Intensity Modes',
    subtitle: 'Step 2: Tailoring Framing to Your Mental State',
    description: 'Click the mode badge in the top navigation bar at any time to switch between 3 distinct AI framing styles depending on your current focus state.',
    keyConcepts: [
      'Coach Mode: Gentle, supportive micro-goals and positive reinforcement. Ideal when feeling overwhelmed or burned out.',
      'Standard Mode: Balanced, objective realism detailing timeline and grade consequences calmly.',
      'Doomsday Mode: Urgent, high-stakes second-person narratives designed to shatter deadline paralysis.'
    ],
    actionStep: 'Click the mode badge at the top header whenever you want to change urgency settings.',
    example: 'Feeling stressed? Switch to Coach Mode for gentle step-by-step guidance.',
    icon: Flame,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 2 of 8: AI Urgency Modes'
  },
  {
    id: 'warroom',
    tabTarget: 'warroom',
    title: 'The Multi-Ring Doomsday Gauge',
    subtitle: 'Step 3: Visualizing Time Buffers Before Panic',
    description: 'Each task features a multi-ring Doomsday Gauge. Unlike static deadlines, this dial visually computes your safety buffer ratio (Time Left ÷ Work Required).',
    keyConcepts: [
      'Outer Ring (Time Buffer): Green = Manageable (> 3.0x), Yellow = Tight (1.5x - 3.0x), Red = Critical (< 1.5x).',
      'Middle Ring (Academic Risk): Measures grade percentage weight and teacher strictness penalty.',
      'Inner Ring (Sleep & Physical Penalty): Shows estimated late-night fatigue and rest disruption.'
    ],
    actionStep: 'Observe the color-coded rings on your task cards in the War Room grid.',
    example: 'When the buffer ratio drops below 1.5x, the gauge pulses red with an urgent warning!',
    icon: Target,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 3 of 8: Risk Dials'
  },
  {
    id: 'prediction',
    tabTarget: 'warroom',
    title: 'Predict Consequence & Split Timelines',
    subtitle: 'Step 4: AI Scenario Engine & Honest Exit',
    description: 'Click "Predict Consequence" on any task card to run a live AI simulation. The Split-Timeline simulator displays your two possible futures side-by-side.',
    keyConcepts: [
      'Timeline A (Start Now): Highlights avoided stress, protected grades, and uninterrupted downtime.',
      'Timeline B (Delay 2 Hours): Displays the cascade of late-night rushing, fatigue, and teacher friction.',
      'Honest Renegotiation: Need an extension? Reset your buffer with an honest reason (+12h, +24h, +48h) instead of ghosting deadlines.'
    ],
    actionStep: 'Click "Predict Consequence" on any task to explore its branching domain breakdown.',
    tip: 'Renegotiating resets the Doomsday Dial while maintaining transparent debt logs.',
    icon: Sparkles,
    iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'Step 4 of 8: Split Timelines'
  },
  {
    id: 'focus',
    tabTarget: 'warroom',
    title: 'Focus Sprint Mode & Counter-Loops',
    subtitle: 'Step 5: Beating the Doomsday Clock',
    description: 'Click "Start Now" to enter Focus Mode. Use the built-in 25-minute Pomodoro timer and update your completion progress with the live slider.',
    keyConcepts: [
      '25-Minute Sprint Timer: Focus on one micro-task block at a time.',
      'Live Progress Slider: Adjust completion percentage as you work.',
      'Positive Counter-Loop: Completing a task triggers a celebration modal summarizing avoided consequences and gained confidence!'
    ],
    actionStep: 'Click "Start Now" on a task to test the Pomodoro focus sprint modal.',
    icon: Play,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 5 of 8: Focus Sprints'
  },
  {
    id: 'timetable',
    tabTarget: 'timetable',
    title: 'Timetable & Human Context Matrix',
    subtitle: 'Step 6: Factoring Teacher Strictness',
    description: 'Switch to the "Timetable & Context" tab to configure your weekly schedule and tag instructors with real human behavior traits.',
    keyConcepts: [
      'Strictness Tags: "Spot Cold-Calls", "Checks Notebook Copies", "Strict Locks Doors", or "Public Scolder".',
      'Stakes Tags: "Graded Quiz", "Notebook Copy", "Lab Practical", or "Presentation".',
      'Grade Weight: Set percentage weight so high-value tasks receive higher risk priority.'
    ],
    actionStep: 'Click "+ Add Timetable Slot" to add a new class with custom start and end times!',
    tip: 'Linking a task to a strict professor automatically boosts its Doomsday risk score.',
    icon: Calendar,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 6 of 8: Human Context'
  },
  {
    id: 'evidence',
    tabTarget: 'evidence',
    title: 'Evidence Case File Log',
    subtitle: 'Step 7: Calibrating AI Accuracy Against Reality',
    description: 'Visit the "Evidence Case File" tab after deadlines pass to log real-world outcomes and rate AI forecast accuracy from 1 to 5 stars.',
    keyConcepts: [
      'Post-Deadline Logging: Record whether you submitted on time or experienced teacher feedback.',
      'Accuracy Rating: Rate AI predictions to help RIPPLE learn your pacing.',
      'Personal Velocity Multiplier: Automatically adjusts estimated work time if tasks take 20% longer than planned.'
    ],
    actionStep: 'Click "Log Post-Deadline Outcome" to save your first case file entry.',
    icon: FileText,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 7 of 8: Evidence Log'
  },
  {
    id: 'debt',
    tabTarget: 'debt',
    title: 'Procrastination Debt Ledger',
    subtitle: 'Step 8: Monitoring Backlog & Recovery',
    description: 'The "Debt Ledger" tab tracks compounding task backlog, total hours behind schedule, missed deadline counts, and 7-day accumulation trends.',
    keyConcepts: [
      'Compounding Score (0-100): Reflects your total task delay liability.',
      '7-Day Debt Trend: Visualizes daily debt hour accumulation.',
      'Recovery Action: Execute short catch-up sprints or switch to Coach Mode to clear debt points.'
    ],
    actionStep: 'Keep your debt compounding score below 40 to preserve peak focus and zero guilt!',
    tip: 'Need quick help anytime? Use the floating AI Assistant button on the bottom right corner!',
    icon: TrendingDown,
    iconColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    badgeText: 'Step 8 of 8: Debt Ledger'
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

  const currentStep = TUTORIAL_STEPS[currentTutorialStep] || TUTORIAL_STEPS[0];
  const totalSteps = TUTORIAL_STEPS.length;
  const progressPercent = Math.round(((currentTutorialStep + 1) / totalSteps) * 100);

  // Auto switch dashboard tabs based on step
  useEffect(() => {
    if (isTutorialOpen && currentStep.tabTarget && onTabChange) {
      onTabChange(currentStep.tabTarget);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-rose-600/10 via-purple-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between text-white p-6 sm:p-8 space-y-6 z-10 animate-in zoom-in-95 duration-200">
        
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