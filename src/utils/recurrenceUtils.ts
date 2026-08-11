import { Task, TimetableSlot, RecurrenceRule } from '@/types/ripple';

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export function formatRecurrenceLabel(rule?: RecurrenceRule, slotOrTaskDate?: string): string {
  if (!rule || rule.type === 'none') {
    return 'Does not repeat (One-time)';
  }

  const interval = rule.interval || 1;
  const intervalPrefix = interval > 1 ? `Every ${interval} ` : 'Every ';

  switch (rule.type) {
    case 'daily':
      return interval === 1 ? 'Repeats Daily' : `${intervalPrefix}Days`;
    case 'weekly': {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        return `${intervalPrefix}Week on ${rule.daysOfWeek.map(d => d.slice(0, 3)).join(', ')}`;
      }
      return interval === 1 ? 'Repeats Weekly' : `${intervalPrefix}Weeks`;
    }
    case 'biweekly':
      return 'Repeats Every 2 Weeks';
    case 'monthly':
      return 'Repeats Monthly';
    case 'custom':
      return `${intervalPrefix}${rule.interval || 1} Custom Cycle`;
    default:
      return 'Repeats Weekly';
  }
}

export function doesSlotOccurOnDate(slot: TimetableSlot, targetDate: Date): boolean {
  const dayName = DAYS_OF_WEEK[targetDate.getDay()];
  const dateStr = targetDate.toISOString().split('T')[0];

  const rule = slot.recurrence;

  // Single occurrence / only this specific date
  if (slot.specificDate) {
    return slot.specificDate === dateStr;
  }

  // If no recurrence specified, default timetable slot behavior is weekly on slot.dayOfWeek
  if (!rule || rule.type === 'weekly') {
    const days = rule?.daysOfWeek || [slot.dayOfWeek];
    if (!days.includes(dayName as any)) {
      return false;
    }

    if (rule?.startDate && dateStr < rule.startDate) return false;
    if (rule?.endDate && dateStr > rule.endDate) return false;

    return true;
  }

  if (rule.type === 'none') {
    return false;
  }

  if (rule.type === 'daily') {
    if (rule.startDate && dateStr < rule.startDate) return false;
    if (rule.endDate && dateStr > rule.endDate) return false;

    if (rule.interval && rule.interval > 1 && rule.startDate) {
      const start = new Date(rule.startDate).getTime();
      const target = new Date(dateStr).getTime();
      const diffDays = Math.floor((target - start) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays % rule.interval === 0;
    }
    return true;
  }

  if (rule.type === 'biweekly') {
    if (slot.dayOfWeek !== dayName) return false;
    if (rule.startDate && dateStr < rule.startDate) return false;
    if (rule.endDate && dateStr > rule.endDate) return false;

    if (rule.startDate) {
      const start = new Date(rule.startDate).getTime();
      const target = new Date(dateStr).getTime();
      const diffWeeks = Math.floor((target - start) / (1000 * 3600 * 24 * 7));
      return diffWeeks >= 0 && diffWeeks % 2 === 0;
    }
    return true;
  }

  if (rule.type === 'monthly') {
    if (rule.startDate) {
      const startD = new Date(rule.startDate).getDate();
      return targetDate.getDate() === startD;
    }
    return targetDate.getDay() === DAYS_OF_WEEK.indexOf(slot.dayOfWeek);
  }

  return slot.dayOfWeek === dayName;
}

export function doesTaskOccurOnDate(task: Task, targetDate: Date): boolean {
  if (!task.dueDate) return false;

  const taskDate = new Date(task.dueDate);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  const taskDateStr = taskDate.toISOString().split('T')[0];

  const rule = task.recurrence;

  // No recurrence rule - exact date match
  if (!rule || rule.type === 'none') {
    return targetDateStr === taskDateStr;
  }

  // Task before start date
  if (targetDateStr < taskDateStr) {
    return false;
  }

  if (rule.endDate && targetDateStr > rule.endDate) {
    return false;
  }

  const dayName = DAYS_OF_WEEK[targetDate.getDay()];

  switch (rule.type) {
    case 'daily': {
      const interval = rule.interval || 1;
      const startMs = new Date(taskDateStr).getTime();
      const targetMs = new Date(targetDateStr).getTime();
      const diffDays = Math.floor((targetMs - startMs) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays % interval === 0;
    }
    case 'weekly': {
      const interval = rule.interval || 1;
      const startMs = new Date(taskDateStr).getTime();
      const targetMs = new Date(targetDateStr).getTime();
      const diffWeeks = Math.floor((targetMs - startMs) / (1000 * 3600 * 24 * 7));
      const isCorrectWeek = diffWeeks >= 0 && diffWeeks % interval === 0;

      if (!isCorrectWeek) return false;

      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        return rule.daysOfWeek.includes(dayName as any);
      }
      return targetDate.getDay() === taskDate.getDay();
    }
    case 'biweekly': {
      const startMs = new Date(taskDateStr).getTime();
      const targetMs = new Date(targetDateStr).getTime();
      const diffWeeks = Math.floor((targetMs - startMs) / (1000 * 3600 * 24 * 7));
      return diffWeeks >= 0 && diffWeeks % 2 === 0 && targetDate.getDay() === taskDate.getDay();
    }
    case 'monthly': {
      return targetDate.getDate() === taskDate.getDate();
    }
    default:
      return targetDateStr === taskDateStr;
  }
}