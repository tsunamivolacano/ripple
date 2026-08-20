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
  CheckCircle2
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
  const { tasks, slots } = useRipple();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'academic' | 'personal'>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Completed status check
    const isCompleted = t.status === 'completed' || t.completionPercentage >= 100;
    if (showCompleted) {
      if (!isCompleted) return false;
    } else {
      if (isCompleted && filterStatus !== 'completed') return false;
    }

    // Category check: use explicit category or taskType, NEVER !t.slotId
    const isPersonal = t.category === 'personal' || ['personal', 'meeting', 'appointment', 'reminder', 'event', 'chore'].includes(t.taskType);
    if (categoryFilter === 'academic' && isPersonal) return false;
    if (categoryFilter === 'personal' && !isPersonal) return false;

    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all' || filterStatus === 'completed') return matchesSearch;
    return t.status === filterStatus && matchesSearch;
  });

  // Critical tasks count
  const criticalCount = tasks.filter((t) => (t.status === 'critical' || t.status === 'too_late') && t.completionPercentage < 100).length;
  const completedCount = tasks.filter((t) => t.status === 'completed' || t.completionPercentage >= 100).length;
  const activeCount = tasks.filter((t) => t.status !== 'completed' && t.completionPercentage < 100).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical Tasks exist */}
      {criticalCount > 0 && !showCompleted && (
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
                Immediate intervention required. Delaying will trigger severe academic or personal consequences.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              const criticalTask = tasks.find((t) => (t.status === 'critical' || t.status === 'too_late') && t.completionPercentage < 100);
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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search active tasks, activities, or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950/80 border-slate-800 text-xs text-white placeholder:text-slate-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'academic', label: 'Academic' },
            { id: 'personal', label: 'Personal / Life' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `Active (${activeCount})` },
            { id: 'critical', label: 'Critical' },
            { id: 'tight', label: 'Tight' },
            { id: 'manageable', label: 'Manageable' },
            { id: 'too_late', label: 'Overdue' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setShowCompleted(false);
                setFilterStatus(btn.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                !showCompleted && filterStatus === btn.id
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}

          {/* Completed Toggle Button */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
              showCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({completedCount})</span>
          </button>
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
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
          <h3 className="text-base font-bold text-white">
            {showCompleted ? 'No completed activities in this view' : 'No active activities found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {showCompleted
              ? 'Complete focus blocks and mark tasks 100% finished to see your triumphs here.'
              : 'You are clear of impending consequence alerts in this filter view. Add a new task or personal activity below.'}
          </p>
          {!showCompleted && (
            <Button
              size="sm"
              onClick={onOpenNewTaskModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              Add New Activity
            </Button>
          )}
        </div>
      )}
    </div>
  );
};