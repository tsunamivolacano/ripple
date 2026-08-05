import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/ripple';
import { 
  AlertTriangle, 
  Clock, 
  Filter, 
  Flame, 
  Plus, 
  Sparkles, 
  ShieldAlert,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface WarRoomProps {
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const WarRoom: React.FC<WarRoomProps> = ({
  onOpenPrediction,
  onOpenFocus,
  onOpenNewTaskModal
}) => {
  const { tasks, slots, debt } = useRipple();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks
  const activeTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return t.status === filterStatus && matchesSearch;
  });

  // Critical tasks needing immediate action
  const criticalCount = tasks.filter((t) => t.status === 'critical' || t.status === 'too_late').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical Tasks exist */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  {criticalCount} Critical Doomsday Clock{criticalCount > 1 ? 's' : ''} Ticking
                </h2>
                <Badge className="bg-rose-500/30 text-rose-200 border-rose-500/50">Urgent</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Immediate intervention required. Delaying will trigger severe academic & emotional domino consequences.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              const criticalTask = tasks.find((t) => t.status === 'critical' || t.status === 'too_late');
              if (criticalTask) onOpenPrediction(criticalTask);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 shrink-0"
          >
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
            Inspect Critical Forecast
          </Button>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search active tasks or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950/80 border-slate-800 text-xs text-white placeholder:text-slate-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'critical', label: 'Critical' },
            { id: 'tight', label: 'Tight' },
            { id: 'manageable', label: 'Manageable' },
            { id: 'too_late', label: 'Overdue' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterStatus(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filterStatus === btn.id
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Grid */}
      {activeTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeTasks.map((task) => {
            const slot = slots.find((s) => s.id === task.slotId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                slot={slot}
                onOpenPrediction={onOpenPrediction}
                onOpenFocus={onOpenFocus}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No active tasks in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are currently clear of impending consequence alerts. Click below to add a new task tied to your schedule.
          </p>
          <Button
            size="sm"
            onClick={onOpenNewTaskModal}
            className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            Add New Task
          </Button>
        </div>
      )}
    </div>
  );
};