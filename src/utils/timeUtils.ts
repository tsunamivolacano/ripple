import { TaskStatus } from '@/types/ripple';

export function getTimeRemaining(dueDateISO?: string): {
  totalMinutes: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
  formattedRemaining: string;
} {
  if (!dueDateISO) {
    return {
      totalMinutes: 999999,
      hours: 999,
      minutes: 0,
      isOverdue: false,
      formattedRemaining: 'No deadline'
    };
  }

  const now = new Date().getTime();
  const due = new Date(dueDateISO).getTime();
  const diffMs = due - now;

  const isOverdue = diffMs <= 0;
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  let formattedRemaining = '';
  if (isOverdue) {
    if (hours > 24) {
      formattedRemaining = `${Math.floor(hours / 24)}d overdue`;
    } else if (hours > 0) {
      formattedRemaining = `${hours}h ${minutes}m overdue`;
    } else {
      formattedRemaining = `${minutes}m overdue`;
    }
  } else {
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      formattedRemaining = `${days}d ${remHours}h left`;
    } else if (hours > 0) {
      formattedRemaining = `${hours}h ${minutes}m left`;
    } else {
      formattedRemaining = `${minutes}m left`;
    }
  }

  return { totalMinutes, hours, minutes, isOverdue, formattedRemaining };
}

export function calculateTaskStatus(
  dueDateISO: string | undefined,
  estimatedHours: number,
  completionPercentage: number,
  velocityMultiplier: number = 1.0,
  hasDeadline: boolean = true
): TaskStatus {
  if (completionPercentage >= 100) {
    return 'completed';
  }

  if (!hasDeadline || !dueDateISO) {
    return 'manageable';
  }

  const { totalMinutes, isOverdue } = getTimeRemaining(dueDateISO);
  if (isOverdue) {
    return 'too_late';
  }

  const remainingWorkHours = estimatedHours * (1 - completionPercentage / 100) * velocityMultiplier;
  const remainingWorkMinutes = remainingWorkHours * 60;

  const timeBufferRatio = totalMinutes / Math.max(remainingWorkMinutes, 15);

  if (timeBufferRatio < 1.0) {
    return 'too_late';
  } else if (timeBufferRatio < 1.5) {
    return 'critical';
  } else if (timeBufferRatio < 3.0) {
    return 'tight';
  } else {
    return 'manageable';
  }
}

export function getStatusTheme(status: TaskStatus) {
  switch (status) {
    case 'manageable':
      return {
        label: 'Manageable',
        color: 'emerald',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        ringColor: '#10b981',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        gradient: 'from-emerald-500/20 to-emerald-900/10'
      };
    case 'tight':
      return {
        label: 'Tight Buffer',
        color: 'amber',
        bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        ringColor: '#f59e0b',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        gradient: 'from-amber-500/20 to-amber-900/10'
      };
    case 'critical':
      return {
        label: 'CRITICAL WARNING',
        color: 'rose',
        bgClass: 'bg-rose-500/15 border-rose-500/50 text-rose-400 animate-pulse',
        ringColor: '#f43f5e',
        badge: 'bg-rose-500/30 text-rose-200 border-rose-500/60 font-bold',
        gradient: 'from-rose-500/25 to-rose-950/20'
      };
    case 'too_late':
      return {
        label: 'DOOMSDAY ARRIVED',
        color: 'purple',
        bgClass: 'bg-purple-900/30 border-purple-500/60 text-purple-300',
        ringColor: '#a855f7',
        badge: 'bg-purple-900/50 text-purple-200 border-purple-500/80 font-extrabold',
        gradient: 'from-purple-900/40 to-slate-950/60'
      };
    case 'renegotiated':
      return {
        label: 'Renegotiated',
        color: 'blue',
        bgClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        ringColor: '#3b82f6',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        gradient: 'from-blue-500/20 to-blue-900/10'
      };
    case 'completed':
    default:
      return {
        label: 'Completed',
        color: 'cyan',
        bgClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        ringColor: '#06b6d4',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        gradient: 'from-cyan-500/20 to-cyan-900/10'
      };
  }
}