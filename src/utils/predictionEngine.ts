import { Task, TimetableSlot, ConsequenceForecast, IntensityMode, DomainConsequence } from '@/types/ripple';
import { getTimeRemaining, calculateTaskStatus } from './timeUtils';

export function generateConsequenceForecast(
  task: Task,
  slot?: TimetableSlot,
  intensityMode: IntensityMode = 'standard',
  velocityMultiplier: number = 1.0
): ConsequenceForecast {
  const { hours, isOverdue } = getTimeRemaining(task.dueDate);
  const status = calculateTaskStatus(task.dueDate, task.estimatedHours, task.completionPercentage, velocityMultiplier);

  const isPersonal = task.category === 'personal' || !slot || ['personal', 'meeting', 'appointment', 'reminder', 'event', 'chore'].includes(task.taskType);

  const teacher = slot?.teacherName || (isPersonal ? 'Your Personal Schedule' : 'your professor/instructor');
  const subject = slot?.subject || (isPersonal ? 'Personal / General Life' : 'this course');
  const strictness = slot?.strictnessTag || 'NOTEBOOK_CHECK';
  const stakes = slot?.stakesTag || 'HOMEWORK';
  const weight = slot?.weight || (isPersonal ? 15 : 20);

  // Strictness descriptions
  const strictnessTextMap: Record<string, string> = {
    COLD_CALL: `${teacher} is famous for spot-checking students who look unprepared and calling on them in front of classmates.`,
    NOTEBOOK_CHECK: `${teacher} manually inspects every submission at the start of class without extension leniency.`,
    ATTENDANCE_STRICT: `${teacher} locks the doors on time and marks late entrants absent.`,
    PUBLIC_SCOLD: `${teacher} publicly displays a list of missing assignments before lecture.`,
    QUIET_TALK: `${teacher} pulls you aside for a disappointing talk regarding effort.`,
    LENIENT: `${teacher} allows late work, but deducts marks for quality standard.`
  };

  const strictnessText = isPersonal
    ? `Delaying this personal commitment (${task.taskType.replace('_', ' ')}) creates schedule overlap and compromises your personal routine.`
    : (strictnessTextMap[strictness] || strictnessTextMap.NOTEBOOK_CHECK);

  // Calculate domain impact scores based on status and slot weight
  const baseImpact = status === 'too_late' ? 90 : status === 'critical' ? 75 : status === 'tight' ? 45 : 20;
  let intensitySeverityBoost = 0;
  if (intensityMode === 'doomsday') {
    intensitySeverityBoost = 25;
  } else if (intensityMode === 'coach') {
    intensitySeverityBoost = -10;
  }

  const academicScore = Math.min(100, Math.max(10, baseImpact + (isPersonal ? 10 : weight * 0.3) + intensitySeverityBoost));
  const socialScore = Math.min(100, Math.max(10, baseImpact + (isPersonal ? 25 : 15) + intensitySeverityBoost));
  const physicalScore = Math.min(100, Math.max(10, (status === 'critical' || status === 'too_late' ? 80 : 35) + intensitySeverityBoost));
  const financialScore = Math.min(100, Math.max(5, (isPersonal && task.taskType === 'appointment' ? 50 : 20) + intensitySeverityBoost));
  const emotionalScore = Math.min(100, Math.max(15, baseImpact + 20 + intensitySeverityBoost));
  const longTermScore = Math.min(100, Math.max(10, baseImpact * 0.8 + (weight * 0.4)));

  // Cinematic Scene Text based on intensity and category
  let cinematicScene = '';
  if (isPersonal) {
    cinematicScene = `You have "${task.title}" scheduled for ${new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Postponing personal tasks causes background mental friction, compounding your schedule backlog and leading to last-minute rushing.`;
  } else if (intensityMode === 'doomsday') {
    cinematicScene = `It is late. You sit staring at an unfinished section of "${task.title}". Tomorrow morning, ${teacher} walks into room ${slot?.room || '101'}, clipboard in hand. ${strictnessText} You feel the knot in your stomach tighten.`;
  } else if (intensityMode === 'coach') {
    cinematicScene = `You have a clear path to finishing "${task.title}". Starting now gives you peace of mind and preserves your personal buffer.`;
  } else {
    cinematicScene = `Delaying "${task.title}" puts your ${subject} schedule under pressure. Delaying trades a relaxed block for an all-nighter emergency prep.`;
  }

  const getSeverity = (score: number): DomainConsequence['severity'] => {
    if (score > 70) return 'severe';
    if (score > 50) return 'high';
    if (score > 30) return 'medium';
    return 'low';
  };

  // Branching Domain Forecasts
  const academic: DomainConsequence = {
    domain: 'Academic',
    severity: getSeverity(academicScore),
    title: isPersonal ? 'Schedule Integrity & Goal Tracking' : `Direct -${Math.round(weight * 0.5)}% Grade Penalty in ${subject}`,
    description: isPersonal 
      ? `Delaying personal goals risks habit decay and task clutter.`
      : `${strictnessText} Missing or rushed submission impacts your internal grade weight (${weight}% category weight).`,
    impactScore: Math.round(academicScore)
  };

  const social: DomainConsequence = {
    domain: 'Social',
    severity: getSeverity(socialScore),
    title: isPersonal ? 'Personal Commitment & Reliability' : 'Class Reputational Impact',
    description: isPersonal 
      ? `Delaying appointments or meetings creates rescheduling friction with others.`
      : `High probability of uncomfortable feedback or missed study group obligations.`,
    impactScore: Math.round(socialScore)
  };

  const physical: DomainConsequence = {
    domain: 'Physical',
    severity: getSeverity(physicalScore),
    title: status === 'critical' ? 'Schedule Stress & Rest Disruption' : 'Late Night Fatigue',
    description: `Pushing this commitment cuts into your personal rest window, increasing anxiety.`,
    impactScore: Math.round(physicalScore)
  };

  const financial: DomainConsequence = {
    domain: 'Financial',
    severity: getSeverity(financialScore),
    title: 'Resource & Cancellation Fee Risk',
    description: task.taskType === 'appointment' 
      ? `Rescheduling late-notice appointments may incur cancellation fees or lost time.`
      : `Indirect friction cost from last-minute rush food/transit.`,
    impactScore: Math.round(financialScore)
  };

  const emotional: DomainConsequence = {
    domain: 'Emotional',
    severity: getSeverity(emotionalScore),
    title: 'Compounding Task Guilt & Friction',
    description: `Carrying uncompleted tasks for "${task.title}" ruins your downtime, causing background dread.`,
    impactScore: Math.round(emotionalScore)
  };

  const longTerm: DomainConsequence = {
    domain: 'Long-term',
    severity: getSeverity(longTermScore),
    title: 'Personal Consistency & Habit Score',
    description: `Fulfilling personal commitments on schedule builds self-trust and operational momentum.`,
    impactScore: Math.round(longTermScore)
  };

  // Split Timelines
  const startNowTimeline = {
    title: 'TIMELINE A: Complete Now (Consequence Avoided)',
    timeframe: 'Next 1-2 Hours',
    outcomeSummary: `Done promptly. Finished with total clarity.`,
    stressLevel: 2,
    academicImpact: 'Full commitment preserved; zero schedule debt.',
    socialImpact: 'Free evening to relax, connect, or sleep without lingering task dread.',
    energyCost: 'Balanced focus flow. High energy restored.',
    actionableStep: 'Start now, spend 20 minutes on the first milestone.'
  };

  const delay2HrTimeline = {
    title: 'TIMELINE B: Delay 2 Hours (Friction Cascade)',
    timeframe: 'Later Tonight',
    outcomeSummary: `Friction mode kick-in. Rushed execution and schedule overlap.`,
    stressLevel: 8,
    academicImpact: `Overlapping commitments and delayed follow-through.`,
    socialImpact: 'Ghosting friends or rescheduling appointments.',
    energyCost: 'Late night fatigue and brain fog.',
    actionableStep: 'Complete now to keep your schedule free.'
  };

  const positiveCounterLoop = {
    headline: `🎯 Commitment Defeated! You beat the clock for "${task.title}"`,
    avoidedConsequence: `You preserved schedule momentum and saved 2+ hours of last-minute stress.`,
    gainedConfidence: `Your self-trust bank increased! Personal velocity calibration updated.`,
    rewardMessage: `Zero lingering guilt tonight. Enjoy total, uninterrupted rest.`
  };

  return {
    academic,
    social,
    physical,
    financial,
    emotional,
    longTerm,
    cinematicScene,
    startNowTimeline,
    delay2HrTimeline,
    positiveCounterLoop
  };
}