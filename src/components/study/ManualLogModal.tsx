import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  onSave: (log: { subject: string; durationMinutes: number; topic?: string }) => void;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, subjects, onSave }) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedSubject(subjects[0] || "General Self-Study");
      setCustomSubject("");
      setDurationHours(1);
      setDurationMinutes(0);
      setTopic("");
    }
  }, [isOpen, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = selectedSubject === "custom" ? customSubject.trim() : selectedSubject || subjects[0];
    if (!finalSubject) return;

    const totalMinutes = Math.round(durationHours * 60 + durationMinutes);
    if (totalMinutes <= 0) return;

    onSave({ subject: finalSubject, durationMinutes: totalMinutes, topic: topic.trim() || undefined });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Log Independent Study Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                {subjects.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
                <SelectItem value="custom">+ Add Custom Subject...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedSubject === "custom" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Custom Subject Name</label>
              <Input
                placeholder="e.g. Psychology"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hours Spent</label>
              <Input
                type="number"
                min={0}
                max={24}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Minutes Spent</label>
              <Input
                type="number"
                min={0}
                max={59}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Topic / Optional Notes</label>
            <Input
              placeholder="e.g. Chapter 4 Integration practice, or Organic reaction notes..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
              Save Study Hours
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};