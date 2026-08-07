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
  RotateCcw,
  Target
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
  tip?: string;
  example?: string;
  icon: React.ElementType;
  iconColor: string;
  badgeText: string;
  highlightSelector?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    tabTarget: 'warroom',
    title: 'Welcome to RIPPLE',
    subtitle: 'Consequence-Aware AI Task System',
    description: 'Traditional task lists fail because deadlines feel abstract. RIPPLE replaces vague due dates with real-time risk predictions, human strictness factors, and multi-domain impact forecasts.',
    tip: 'RIPPLE measures how your delay today impacts your sleep, grades, and reputation tomorrow.',
    icon: Zap,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 1 of 8: Platform Overview'
  },
  {
    id: 'intensity',
    tabTarget: 'warroom',
    title: 'AI Prediction Intensity',
    subtitle: 'Tailor framing to your current focus state',
    description: 'Switch between 3 distinct AI modes using the header badge:\n• Coach Mode: Supportive, step-by-step guidance.\n• Standard Mode: Objective, realistic consequence analysis.\n• Doomsday Mode: Urgent, high-stakes narratives to overcome paralysis.',
    tip: 'Click the mode badge at the top anytime to adjust urgency.',
    example: 'Feeling overwhelmed? Switch to Coach Mode for gentle micro-goals.',
    icon: Flame,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 2 of 8: Intensity Modes'
  },
  {
    id: 'warroom',
    tabTarget: 'warroom',
    title: 'The War Room & Doomsday Dials',
    subtitle: 'Visualizing time buffers before panic sets in',
    description: 'Each task features a multi-ring Doomsday Gauge. The outer ring displays remaining time buffer. The inner rings monitor academic risk and sleep penalties before they occur.',
    tip: 'Green = Manageable | Yellow = Tight Buffer | Red = Critical Warning.',
    example: 'When buffer ratio drops below 1.5x, the gauge pulses red!',
    icon: Target,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 3 of 8: Multi-Ring Gauges'
  },
  {
    id: 'prediction',
    tabTarget: 'warroom',
    title: 'Predict Consequence & Split Timelines',
    subtitle: 'Compare future outcomes side-by-side',
    description: 'Click "Predict Consequence" on any task to run a live AI simulation. The Split-Timeline simulator displays Timeline A (Start Now) vs Timeline B (Delay 2 Hours) so you see exact trade-offs.',
    tip: 'You can renegotiate task deadlines directly from the prediction modal.',
    icon: Sparkles,
    iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'Step 4 of 8: Consequence Forecasts'
  },
  {
    id: 'focus',
    tabTarget: 'warroom',
    title: 'Focus Sprint Mode',
    subtitle: 'Beat the clock one 25-minute sprint at a time',
    description: 'Click "Start Now" to enter Focus Mode. Use the built-in Pomodoro sprint timer and drag the live progress slider to update task completion in real-time.',
    tip: 'Completing tasks triggers a positive counter-loop celebrating avoided consequences!',
    icon: Play,
    iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    badgeText: 'Step 5 of 8: Focus Mode'
  },
  {
    id: 'timetable',
    tabTarget: 'timetable',
    title: 'Timetable & Human Context Matrix',
    subtitle: 'Factoring teacher habits and grade weights',
    description: 'Configure your weekly schedule and tag instructors with real human behavior tags like "Spot Cold-Calls", "Notebook Checker", or "Public Scolder". RIPPLE incorporates these into predictions.',
    tip: 'A task under a strict professor gets prioritized automatically!',
    icon: Calendar,
    iconColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    badgeText: 'Step 6 of 8: Schedule Context'
  },
  {
    id: 'evidence',
    tabTarget: 'evidence',
    title: 'Evidence Case File Log',
    subtitle: 'Calibrating AI accuracy against reality',
    description: 'After deadlines pass, log the actual real-world outcome in your Case File. Rate AI forecast accuracy (1 to 5 stars) to help RIPPLE adapt to your personal pacing.',
    tip: 'Reviewing past case files builds self-awareness against task delay.',
    icon: FileText,
    iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    badgeText: 'Step 7 of 8: Evidence Log'
  },
  {
    id: 'debt',
    tabTarget: 'debt',
    title: 'Procrastination Debt Ledger',
    subtitle: 'Tracking hours behind schedule and compounding score',
    description: 'The Debt Ledger monitors accumulated task backlog, missed deadline counts, and your 7-day debt trend. Execute catch-up sprints to clear task debt and keep scores low.',
    tip: 'Keeping debt score below 40 preserves peak mental focus.',
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

  // Auto switch dashboard tabs based on tutorial step requirements
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Background Ambient Spotlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-rose-600/10 via-purple-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Tutorial Modal Box */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between text-white p-6 sm:p-7 space-y-6 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Top Header Row */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <Badge variant="outline" className="bg-slate-950/80 border-slate-700 text-slate-300 text-xs px-2.5 py-1 font-mono">
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
              <span>Tutorial Progress</span>
              <span className="text-rose-400 font-extrabold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-slate-950 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-indigo-500" />
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4 my-2">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border shrink-0 ${currentStep.iconColor} shadow-lg`}>
              <Icon className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-xs font-semibold text-rose-300 mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {currentStep.description}
          </p>

          {/* Tip Box */}
          {currentStep.tip && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block text-[11px] uppercase tracking-wide">Pro Tip:</span>
                <p className="text-[11px] leading-snug">{currentStep.tip}</p>
              </div>
            </div>
          )}

          {/* Practical Example Box */}
          {currentStep.example && (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-200">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-300 block text-[11px] uppercase tracking-wide">Real Scenario Example:</span>
                <p className="text-[11px] leading-snug">{currentStep.example}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Toolbar */}
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 px-5 shadow-lg shadow-rose-950"
            >
              <span>{currentTutorialStep === totalSteps - 1 ? 'Finish & Start RIPPLE' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};