import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { TaskType, TaskCategory, ReminderTiming, RecurrenceType, RecurrenceRule } from '@/types/ripple';
import { REMINDER_LABEL_MAP } from '@/utils/notificationService';
import { Plus, GraduationCap, User, Bell, Clock, Repeat, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REMINDER_OPTIONS: ReminderTiming[] = ['exact', '5m', '15m', '30m', '1h', '1d'];
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask, slots, notificationSettings } = useRipple();

  const [category, setCategory] = useState<TaskCategory>('academic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slotId, setSlotId] = useState(slots[0]?.id || '');

  // Flexible Deadline Toggle
  const [hasDeadline, setHasDeadline] = useState<boolean>(true);
  
  // Due date & time setup
  const [dueOption, setDueOption] = useState<'hours' | 'custom'>('hours');
  const [hoursLeft, setHoursLeft] = useState(4);
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('18:00');

  const [estimatedHours, setEstimatedHours] = useState(1.0);
  const [taskType, setTaskType] = useState<TaskType>('problem_set');

  // Recurrence Google Calendar Controls
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<string[]>(['Monday']);
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');

  // Multi-reminder selection
  const [selectedReminders, setSelectedReminders] = useState<ReminderTiming[]>(
    notificationSettings.defaultTaskReminders || ['15m', 'exact']
  );

  const handleCategoryChange = (cat: TaskCategory) => {
    setCategory(cat);
    if (cat === 'personal') {
      setTaskType('personal');
      setHasDeadline(false);
    } else {
      setTaskType('problem_set');
      setHasDeadline(true);
    }
  };

  const toggleReminder = (opt: ReminderTiming) => {
    if (selectedReminders.includes(opt)) {
      setSelectedReminders(selectedReminders.filter((r) => r !== opt));
    } else {
      setSelectedReminders([...selectedReminders, opt]);
    }
  };

  const toggleDayOfWeek = (day: string) => {
    if (selectedWeeklyDays.includes(day)) {
      if (selectedWeeklyDays.length > 1) {
        setSelectedWeeklyDays(selectedWeeklyDays.filter((d) => d !== day));
      }
    } else {
      setSelectedWeeklyDays([...selectedWeeklyDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let dueDateISO: string | undefined = undefined;
    if (hasDeadline) {
      if (dueOption === 'hours') {
        dueDateISO = new Date(Date.now() + hoursLeft * 3600 * 1000).toISOString();
      } else {
        dueDateISO = new Date(`${customDate}T${customTime}:00`).toISOString();
      }
    }

    let recurrenceRule: RecurrenceRule | undefined = undefined;
    if (recurrenceType !== 'none') {
      recurrenceRule = {
        type: recurrenceType,
        interval: repeatInterval,
        daysOfWeek: recurrenceType === 'weekly' ? (selectedWeeklyDays as any) : undefined,
        startDate: customDate,
        endDate: hasEndDate ? endDate : undefined
      };
    }

    addTask({
      title,
      description,
      slotId: category === 'academic' ? slotId : undefined,
      hasDeadline,
      dueDate: dueDateISO,
      estimatedHours,
      completionPercentage: 0,
      taskType,
      category,
      reminders: hasDeadline ? selectedReminders : [],
      recurrence: recurrenceRule
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setRecurrenceType('none');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-500" />
            Add Activity or Task
          </DialogTitle>
        </DialogHeader>

        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-xl border border-slate-800 my-2">
          <button
            type="button"
            onClick={() => handleCategoryChange('academic')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              category === 'academic'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Academic Task
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('personal')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              category === 'personal'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            General / Self-Study
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Title</label>
            <Input
              placeholder={
                category === 'academic'
                  ? 'e.g. Physics Numerical Homework'
                  : 'e.g. Daily Math Practice / Reading Chapter 3'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-900 border-slate-800 text-xs text-white"
            />
          </div>

          {category === 'academic' ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Link to Timetable Slot / Subject</label>
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  {slots.length > 0 ? (
                    slots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.subject} ({s.teacherName} • {s.strictnessTag.replace('_', ' ')})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none">General Academic (No Slot Link)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Activity Type</label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="self_study">Self-Study / Revision</SelectItem>
                  <SelectItem value="reading">Reading / Practice</SelectItem>
                  <SelectItem value="personal">Personal Goal / Task</SelectItem>
                  <SelectItem value="meeting">Meeting / Call</SelectItem>
                  <SelectItem value="appointment">Appointment / Checkup</SelectItem>
                  <SelectItem value="chore">Chore / Errand</SelectItem>
                  <SelectItem value="event">Event / Celebration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Flexible Deadline Toggle */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200 block">Set Explicit Submission Deadline</span>
              <span className="text-[11px] text-slate-400">
                {hasDeadline
                  ? 'Triggers Doomsday risk calculations and reminder alerts.'
                  : 'Flexible activity / general self-study without submission panic.'}
              </span>
            </div>
            <Switch checked={hasDeadline} onCheckedChange={setHasDeadline} />
          </div>

          {/* Google Calendar Recurrence Selector */}
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                Recurrence (Google Calendar Style)
              </label>
              <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                <SelectTrigger className="w-40 bg-slate-950 border-slate-800 text-xs text-white h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekly">Every week</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Every month</SelectItem>
                  <SelectItem value="custom">Custom repeat...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence Details */}
            {recurrenceType === 'weekly' && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300 block">Repeat On Days:</span>
                <div className="flex flex-wrap gap-1">
                  {ALL_DAYS.map((d) => {
                    const isSelected = selectedWeeklyDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDayOfWeek(d)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {recurrenceType === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">Repeat Interval</span>
                  <Input
                    type="number"
                    min={1}
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Number(e.target.value))}
                    className="bg-slate-950 border-slate-800 text-xs font-mono text-white h-8"
                  />
                </div>
              </div>
            )}

            {recurrenceType !== 'none' && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-300">Set End Date Cutoff?</span>
                <Switch checked={hasEndDate} onCheckedChange={setHasEndDate} />
              </div>
            )}

            {recurrenceType !== 'none' && hasEndDate && (
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white h-8"
              />
            )}
          </div>

          {/* Due Date Controls if Deadline Active */}
          {hasDeadline && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Deadline / Start Time</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDueOption('hours')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dueOption === 'hours'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Hours Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueOption('custom')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dueOption === 'custom'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Specific Date & Time
                  </button>
                </div>
              </div>

              {dueOption === 'hours' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Hours Until Due</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={hoursLeft}
                      onChange={(e) => setHoursLeft(Number(e.target.value))}
                      className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Estimated Effort (Hrs)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Due Date</label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Due Time</label>
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasDeadline && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Estimated Duration (Hours)</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
              />
            </div>
          )}

          {/* Reminder Timing Selector if Deadline Active */}
          {hasDeadline && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                Background Reminder Timing (Multi-Select)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {REMINDER_OPTIONS.map((opt) => {
                  const isSelected = selectedReminders.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleReminder(opt)}
                      className={`p-1.5 rounded-lg border text-[10px] font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {REMINDER_LABEL_MAP[opt]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description / Optional Notes</label>
            <Textarea
              placeholder="Key notes or sub-tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs text-white h-16"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs">
              Add Activity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};