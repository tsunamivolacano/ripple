import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { TaskType, TaskCategory, ReminderTiming, RecurrenceType, RecurrenceRule } from '@/types/ripple';
import { REMINDER_LABEL_MAP } from '@/utils/notificationService';
import { Plus, GraduationCap, User, Bell, Clock, Repeat, Calendar, BookOpen, AlertOctagon, FileText, Sparkles } from 'lucide-react';
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
  const [taskType, setTaskType] = useState<TaskType>('exam');
  const [title, setTitle] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [description, setDescription] = useState('');
  const [slotId, setSlotId] = useState(slots[0]?.id || '');

  // Flexible Deadline Toggle
  const [hasDeadline, setHasDeadline] = useState<boolean>(true);
  
  // Due date & time setup
  const [dueOption, setDueOption] = useState<'hours' | 'custom'>('custom');
  const [hoursLeft, setHoursLeft] = useState(24);
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('09:00');

  const [estimatedHours, setEstimatedHours] = useState(2.0);

  // Recurrence Controls
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<string[]>(['Monday']);
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');

  // Multi-reminder selection
  const [selectedReminders, setSelectedReminders] = useState<ReminderTiming[]>(
    notificationSettings.defaultTaskReminders || ['1d', '1h', '15m']
  );

  const handleCategoryChange = (cat: TaskCategory) => {
    setCategory(cat);
    if (cat === 'personal') {
      setTaskType('personal');
      setHasDeadline(false);
    } else {
      setTaskType('exam');
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
      syllabus: syllabus.trim() || undefined,
      description,
      slotId: category === 'academic' ? (slotId === 'none' ? undefined : slotId) : undefined,
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
    setSyllabus('');
    setDescription('');
    setRecurrenceType('none');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-400">
            <Plus className="w-5 h-5 text-rose-500" />
            Schedule Academic Event or Task
          </DialogTitle>
        </DialogHeader>

        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-xl border border-slate-800 my-1">
          <button
            type="button"
            onClick={() => handleCategoryChange('academic')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              category === 'academic'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Academic Event
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('personal')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
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
          {category === 'academic' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Academic Event Type</label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger className="bg-slate-900 border-rose-500/40 text-xs text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="exam">🏆 Major Exam / Midterm / Final</SelectItem>
                  <SelectItem value="test">✍️ Class Test / Quiz</SelectItem>
                  <SelectItem value="assignment">📄 Assignment / Homework</SelectItem>
                  <SelectItem value="deadline">⏳ Project / Submission Deadline</SelectItem>
                  <SelectItem value="study_session">📚 Planned Study Session / Revision</SelectItem>
                  <SelectItem value="essay">📝 Essay / Paper</SelectItem>
                  <SelectItem value="lab_report">🧪 Lab Practical / Report</SelectItem>
                  <SelectItem value="problem_set">📐 Problem Set / Numericals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {category === 'personal' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Activity Type</label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="self_study">Self-Study / Revision Goal</SelectItem>
                  <SelectItem value="reading">Reading / Practice Session</SelectItem>
                  <SelectItem value="personal">Personal Goal / Routine</SelectItem>
                  <SelectItem value="meeting">Meeting / Call</SelectItem>
                  <SelectItem value="appointment">Appointment / Checkup</SelectItem>
                  <SelectItem value="chore">Chore / Errand</SelectItem>
                  <SelectItem value="event">Event / Occasion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {taskType === 'exam' ? 'Exam Name' : taskType === 'test' ? 'Test Name' : 'Event Title'}
            </label>
            <Input
              placeholder={
                taskType === 'exam'
                  ? 'e.g. Physics Midterm Exam 2025'
                  : taskType === 'test'
                  ? 'e.g. Organic Chemistry Unit Test'
                  : taskType === 'assignment'
                  ? 'e.g. Calculus Problem Set 4'
                  : 'e.g. Chapter 5 Revision Session'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-900 border-slate-800 text-xs text-white"
            />
          </div>

          {/* Syllabus / Topics to Cover (Featured for Exam, Test, Assignment, Study Session) */}
          {(taskType === 'exam' || taskType === 'test' || taskType === 'assignment' || taskType === 'study_session') && (
            <div className="space-y-1 p-3.5 bg-indigo-950/30 rounded-xl border border-indigo-500/30">
              <label className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Syllabus & Topics to Cover
              </label>
              <Textarea
                placeholder="List key chapters, topics, formulas, or units (e.g. Chapter 4 Integration, Vectors, Wave Optics, Lab errors...)"
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-slate-200 h-20 placeholder:text-slate-500"
              />
            </div>
          )}

          {category === 'academic' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Link to Timetable Class / Subject</label>
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="none">General Academic (No Specific Class)</SelectItem>
                  {slots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.subject} ({s.teacherName} • {s.strictnessTag.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Flexible Deadline Toggle */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200 block">Set Event Date & Time</span>
              <span className="text-[11px] text-slate-400">
                {hasDeadline
                  ? 'Displays in Calendar and sends background reminders.'
                  : 'Flexible self-paced activity.'}
              </span>
            </div>
            <Switch checked={hasDeadline} onCheckedChange={setHasDeadline} />
          </div>

          {/* Due Date Controls if Deadline Active */}
          {hasDeadline && (
            <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  Event Date & Time
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDueOption('custom')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dueOption === 'custom'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Specific Date & Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueOption('hours')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dueOption === 'hours'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Hours From Now
                  </button>
                </div>
              </div>

              {dueOption === 'custom' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Exam / Event Date</label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Exam / Start Time</label>
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Hours Until Event</label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={hoursLeft}
                      onChange={(e) => setHoursLeft(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Estimated Duration (Hrs)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reminder Timing Selector */}
          {hasDeadline && (
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                Background Exam / Event Reminders (Multi-Select)
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
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {REMINDER_LABEL_MAP[opt]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Additional Instructions / Notes</label>
            <Textarea
              placeholder="Exam hall room, allowed materials, calculator rules, or sub-goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs text-white h-16"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5">
              Save Academic Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};