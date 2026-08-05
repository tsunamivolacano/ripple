import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/ripple';
import { 
  Clock, 
  Flame, 
  Plus, 
  ShieldAlert,
  Search,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface WarRoomProps {
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
  onOpenNewTaskModal: () => void;
  onGoToTimetable?: () => void;
}

export const WarRoom: React.FC<WarRoomProps> = ({
  onOpenPrediction,
  onOpenFocus,
  onOpenNewTaskModal,
  onGoToTimetable
}) => {
  const { tasks, slots } = useRipple();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return t.status === filterStatus && matchesSearch;
  });

  const criticalCount = tasks.filter((t) => t.status === 'critical' || t.status === 'too_late').length;

  return (
    <div className="space-y-6">
      {criticalCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {criticalCount} Critical Doomsday Clock{criticalCount > 1 ? 's' : ''} Ticking
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">Immediate intervention required to avoid domino consequences.</p>
            </div>
          </div>
          <Button onClick={() => onOpenPrediction(activeTasks[0])} className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shrink-0">
            <Flame className="w-4 h-4 text-amber-300" />
            Inspect Critical Forecast
          </Button>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="p-8 text-center bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-lg font-bold text-white">No Timetable Configured</h3>
            <p className="text-xs text-slate-400 mt-2">Add your classes or meetings to enable the AI consequence engine.</p>
          </div>
          <Button onClick={onGoToTimetable} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            Setup Timetable Matrix
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Your War Room is Empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Add a task tied to your schedule to begin doomsday tracking.</p>
          <Button onClick={onOpenNewTaskModal} className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5">
            <Plus className="w-4 h-4" />
            Add First Task
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search active tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950/80 border-slate-800 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['all', 'critical', 'tight', 'manageable', 'too_late'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setFilterStatus(btn)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    filterStatus === btn ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {btn.charAt(0).toUpperCase() + btn.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                slot={slots.find((s) => s.id === task.slotId)}
                onOpenPrediction={onOpenPrediction}
                onOpenFocus={onOpenFocus}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};