import React, { useState, useMemo } from 'react';
import { useRipple } from '@/context/RippleContext';
import { Task, TimetableSlot } from '@/types/ripple';
import { CalendarHeader, ViewMode, FilterType } from './CalendarHeader';
import { MonthViewGrid } from './MonthViewGrid';
import { WeekViewGrid } from './WeekViewGrid';
import { DayViewGrid } from './DayViewGrid';
import { CalendarModals } from './CalendarModals';
import { doesTaskOccurOnDate, doesSlotOccurOnDate } from '@/utils/recurrenceUtils';

interface CalendarViewProps {
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenPrediction,
  onOpenFocus,
  onOpenNewTaskModal
}) => {
  const { tasks, slots, deleteTask, deleteSlot } = useRipple();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
    } catch {
      return 'Local Time';
    }
  }, []);

  const today = new Date();

  const getItemsForDate = (date: Date) => {
    const dayTasks = tasks.filter((t) => {
      if (t.status === 'completed' && filterType === 'classes') return false;
      return doesTaskOccurOnDate(t, date);
    });

    const daySlots = slots.filter((s) => doesSlotOccurOnDate(s, date));

    return { dayTasks, daySlots };
  };

  const navigateDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + amount);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + amount * 7);
    } else {
      newDate.setDate(newDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const currentWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  const currentMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    let startDay = firstDayOfMonth.getDay();
    const leadingPadding = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < leadingPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  return (
    <div className="space-y-6">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        filterType={filterType}
        userTimeZone={userTimeZone}
        onNavigate={navigateDate}
        onGoToToday={goToToday}
        onViewModeChange={setViewMode}
        onFilterTypeChange={setFilterType}
        onOpenNewTaskModal={onOpenNewTaskModal}
      />

      {viewMode === 'month' && (
        <MonthViewGrid
          currentMonthDays={currentMonthDays}
          today={today}
          filterType={filterType}
          getItemsForDate={getItemsForDate}
          onSelectTask={setSelectedTask}
          onSelectSlot={setSelectedSlot}
        />
      )}

      {viewMode === 'week' && (
        <WeekViewGrid
          currentWeekDays={currentWeekDays}
          hours={hours}
          today={today}
          filterType={filterType}
          getItemsForDate={getItemsForDate}
          onSelectTask={setSelectedTask}
          onSelectSlot={setSelectedSlot}
        />
      )}

      {viewMode === 'day' && (
        <DayViewGrid
          currentDate={currentDate}
          today={today}
          userTimeZone={userTimeZone}
          hours={hours}
          filterType={filterType}
          getItemsForDate={getItemsForDate}
          onSelectTask={setSelectedTask}
          onSelectSlot={setSelectedSlot}
          onOpenPrediction={onOpenPrediction}
        />
      )}

      <CalendarModals
        selectedTask={selectedTask}
        selectedSlot={selectedSlot}
        onCloseTaskModal={() => setSelectedTask(null)}
        onCloseSlotModal={() => setSelectedSlot(null)}
        onOpenPrediction={onOpenPrediction}
        onOpenFocus={onOpenFocus}
        onDeleteTask={deleteTask}
        onDeleteSlot={deleteSlot}
      />
    </div>
  );
};