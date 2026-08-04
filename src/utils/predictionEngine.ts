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

  const teacher = slot?.teacherName || 'your professor/instructor';
  const subject = slot?.subject || 'this course';
  const strictness = slot?.strictnessTag || 'NOTEBOOK_CHECK';
  const stakes = slot?.stakesTag || 'HOMEWORK';
  const weight = slot?.weight || 20;

  // Strictness descriptions
  const strictnessTextMap: Record<string, string> = {
    COLD_CALL: `${teacher} is famous for spot-checking students who look unprepared and calling on them in front of 40 classmates.`,
    NOTEBOOK_CHECK: `${teacher} manually inspects every submission at the start of class without extension leniency.`,
    ATTENDANCE_STRICT: `${teacher} locks the classroom doors on submission dates and marks late entrants absent.`,
    PUBLIC_SCOLD: `${teacher} publicly displays a list of missing assignments or calls out unsubmitted work before starting the lecture.`,
    QUIET_TALK: `${teacher} pulls you aside after class for a disappointing talk regarding your academic effort.`,
    LENIENT: `${teacher} allows late work, but deducts 10% per day and marks down quality standards.`
  };

  const strictnessText = strictnessTextMap[strictness] || strictnessTextMap.NOTEBOOK_CHECK;

  // Intensity tone tweaks
  let prefix = '';
  let intensitySeverityBoost = 0;
  if (intensityMode === 'doomsday') {
    prefix = '🔥 DOOMSDAY SIMULATION: ';
    intensitySeverityBoost = 25;
  } else if (intensityMode === 'coach') {
    prefix = '💡 COACH ADVICE: ';
    intensitySeverityBoost = -10;
  }

  // Calculate domain impact scores based on status and slot weight
  const baseImpact = status === 'too_late' ? 90 : status === 'critical' ? 75 : status === 'tight' ? 45 : 20;
  
  const academicScore = Math.min(100, Math.max(10, baseImpact + (weight * 0.3) + intensitySeverityBoost));
  const socialScore = Math.min(100, Math.max(10, (strictness === 'PUBLIC_SCOLD' || strictness === 'COLD_CALL' ? baseImpact + 30 : baseImpact) + intensitySeverityBoost));
  const physicalScore = Math.min(100, Math.max(10, (status === 'critical' || status === 'too_late' ? 80 : 35) + intensitySeverityBoost));
  const financialScore = Math.min(100, Math.max(5, (weight > 40 ? 60 : 20) + intensitySeverityBoost));
  const emotionalScore = Math.min(100, Math.max(15, baseImpact + 15 + intensitySeverityBoost));
  const longTermScore = Math.min(100, Math.max(10, baseImpact * 0.8 + (weight * 0.4)));

  // Cinematic Scene Text based on intensity
  let cinematicScene = '';
  if (intensityMode === 'doomsday') {
    cinematicScene = `It is 11:42 PM. You sit staring at an unfinished section of "${task.title}". Tomorrow morning at 8:30 AM, ${teacher} walks into room ${slot?.room || '101'}, clipboard in hand. ${strictnessText} You feel the knot in your stomach tighten as the clock ticks away your sleeping window, leaving you with 3 hours of restless nap time and zero margin for error.`;
  } else if (intensityMode === 'coach') {
    cinematicScene = `You currently have a realistic path to finishing "${task.title}" for ${subject}. If you start right now, you'll finish with time left to review and enjoy a calm evening without midnight anxiety. Let's tackle it step-by-step.`;
  } else {
    cinematicScene = `Delaying "${task.title}" puts your ${subject} grade under direct pressure. ${teacher} holds a strict standard for ${stakes.replace('_', ' ').toLowerCase()} assignments. Delaying by 2 hours trades a relaxed evening for an all-nighter emergency prep.`;
  }

  // Helper function returning strongly-typed DomainConsequence severity
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
    title: academicScore > 60 ? `Direct -${Math.round(weight * 0.5)}% Grade Penalty in ${subject}` : `Minor Grade Risk in ${subject}`,
    description: `${strictnessText} Missing or rushed submission impacts your internal grade weight (${weight}% category weight).`,
    impactScore: Math.round(academicScore)
  };

  const social: DomainConsequence = {
    domain: 'Social',
    severity: getSeverity(socialScore),
    title: strictness === 'PUBLIC_SCOLD' ? 'Public Accountability In Class' : 'Group Study Reputational Stress',
    description: strictness === 'PUBLIC_SCOLD' 
      ? `High probability of uncomfortable public feedback or cold-call during the ${subject} slot.`
      : `You'll be forced to decline evening social plans or study group hangouts to catch up on late submission.`,
    impactScore: Math.round(socialScore)
  };

  const physical: DomainConsequence = {
    domain: 'Physical',
    severity: getSeverity(physicalScore),
    title: status === 'critical' ? 'Severe Sleep Deprivation & Caffeine Crash' : 'Late Night Fatigue',
    description: status === 'critical' 
      ? `Pushing this task past 11 PM cuts your deep sleep cycle to under 4.5 hours, impairing memory retention for tomorrow's classes.`
      : `Moderate fatigue tomorrow morning, requiring extra caffeine to maintain focus.`,
    impactScore: Math.round(physicalScore)
  };

  const financial: DomainConsequence = {
    domain: 'Financial',
    severity: getSeverity(financialScore),
    title: 'Resource & Retake Opportunity Cost',
    description: weight > 30 
      ? `Higher likelihood of needing paid tutoring or course repeat fee risks if foundational grade drops.`
      : `Minor indirect cost from emergency food delivery during late night rush.`,
    impactScore: Math.round(financialScore)
  };

  const emotional: DomainConsequence = {
    domain: 'Emotional',
    severity: getSeverity(emotionalScore),
    title: 'Compounding Task Guilt & Anxiety',
    description: `Carrying unfinished weight for "${task.title}" ruins your downtime, causing background dread during leisure activities.`,
    impactScore: Math.round(emotionalScore)
  };

  const longTerm: DomainConsequence = {
    domain: 'Long-term',
    severity: getSeverity(longTermScore),
    title: 'Teacher Recommendation & Habit Drift',
    description: `${teacher}'s perception of your reliability directly influences future reference letters, project group pairing, and academic standing.`,
    impactScore: Math.round(longTermScore)
  };

  // Split Timelines
  const startNowTimeline = {
    title: 'TIMELINE A: Start Now (Consequence Avoided)',
    timeframe: 'Next 2-3 Hours',
    outcomeSummary: `Focused work session. Finished by ${new Date(Date.now() + task.estimatedHours * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with zero rush.`,
    stressLevel: 2,
    academicImpact: 'Full grade points preserved (100% submission quality).',
    socialImpact: 'Free evening to relax, chat, or sleep without lingering task dread.',
    energyCost: 'Balanced focus flow. High energy restored after full night sleep.',
    actionableStep: 'Open doc / notes, set 25-minute pomodoro, write first 3 key points.'
  };

  const delay2HrTimeline = {
    title: 'TIMELINE B: Delay 2 Hours (Cascading Dominoes)',
    timeframe: '11:00 PM – 2:30 AM',
    outcomeSummary: `Panic mode kick-in. Rushed work, typos, missing requirements, and high heart rate.`,
    stressLevel: 9,
    academicImpact: `Submission submitted at deadline edge. Partial credit loss risk under ${teacher}'s evaluation.`,
    socialImpact: 'Grumpy demeanor tomorrow, canceled coffee catch-up, ghosting friends.',
    energyCost: 'Heavy eye fatigue, brain fog during morning ${subject} lecture.',
    actionableStep: 'Recalculate or start immediately to avoid total timeline lock-in.'
  };

  // Positive Counter Loop (when task is completed)
  const positiveCounterLoop = {
    headline: `🎯 Consequence Defeated! You beat the Doomsday Clock for "${task.title}"`,
    avoidedConsequence: `You avoided a potential ${Math.round(weight * 0.4)}% grade loss under ${teacher} and saved 3+ hours of high-stress midnight panicking.`,
    gainedConfidence: `Your self-trust bank increased. Task velocity calibration updated to reflect your prompt finish!`,
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