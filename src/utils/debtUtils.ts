import { Task, EvidenceEntry, ProcrastinationDebt } from '@/types/ripple';

export function calculateDebt(tasks: Task[], evidenceEntries: EvidenceEntry[]): ProcrastinationDebt {
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const missed = activeTasks.filter((t) => t.status === 'too_late').length;
  
  // Total hours behind
  const totalHoursBehind = Number(
    activeTasks
      .filter((t) => t.status === 'critical' || t.status === 'too_late')
      .reduce((sum, t) => sum + t.estimatedHours * (1 - t.completionPercentage / 100), 0)
      .toFixed(1)
  );

  // Compounding score 0-100
  const compoundingScore = Math.min(
    100,
    Math.round(missed * 25 + totalHoursBehind * 8 + activeTasks.length * 4)
  );

  const completedOnTime = evidenceEntries.filter((e) => e.wasOnTime).length;

  return {
    totalHoursBehind,
    missedDeadlinesCount: missed,
    streakDays: completedOnTime,
    compoundingScore,
    weeklyDebtTrend: [
      { day: 'Mon', debtHours: Math.max(0.5, totalHoursBehind * 0.3) },
      { day: 'Tue', debtHours: Math.max(0.8, totalHoursBehind * 0.5) },
      { day: 'Wed', debtHours: Math.max(0.4, totalHoursBehind * 0.4) },
      { day: 'Thu', debtHours: Math.max(1.2, totalHoursBehind * 0.7) },
      { day: 'Fri', debtHours: Math.max(1.5, totalHoursBehind * 0.9) },
      { day: 'Sat', debtHours: Math.max(1.0, totalHoursBehind * 0.8) },
      { day: 'Sun', debtHours: totalHoursBehind }
    ]
  };
}