import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { TimetableSlot } from '@/types/ripple';
import { TeacherTagEditor } from './TeacherTagEditor';
import { 
  Calendar, 
  Plus, 
  UserCheck, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const TimetableGrid: React.FC = () => {
  const { slots, deleteSlot } = useRipple();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  const days: TimetableSlot['dayOfWeek'][] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Timetable & Human Context Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your real-world weekly slots, teacher strictness habits, and grade weights for accurate AI forecasts.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingSlot(null);
            setIsEditorOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Timetable Slot
        </Button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day);
          return (
            <div key={day} className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-3 space-y-3">
              <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {day}
                </span>
                <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-800">
                  {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {daySlots.length > 0 ? (
                <div className="space-y-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 space-y-2 transition-all relative group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-extrabold text-white">
                            {slot.subject}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {slot.startTime} – {slot.endTime} ({slot.room})
                          </span>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSlot(slot);
                              setIsEditorOpen(true);
                            }}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            className="text-slate-400 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-medium text-slate-300">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-amber-400" />
                            {slot.teacherName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {slot.weight}% weight
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[9px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.5 rounded">
                            {slot.strictnessTag.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                            {slot.stakesTag.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 text-center py-6">
                  No classes configured
                </p>
              )}
            </div>
          );
        })}
      </div>

      <TeacherTagEditor
        isOpen={isEditorOpen}
        editingSlot={editingSlot}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
};