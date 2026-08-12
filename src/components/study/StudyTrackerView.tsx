import { useState, useCallback, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { supabase, getCurrentUserId } from '@/lib/supabase';

interface StudySession {
  id: string;
  user_id: string;
  subject: string;
  duration_minutes: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface StudyStats {
  totalSessions: number;
  totalMinutes: number;
  averageDuration: number;
  subjects: Record<string, number>;
}

const calculateStats = (sessions: StudySession[]): StudyStats => {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const averageDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
  
  const subjects: Record<string, number> = {};
  sessions.forEach(s => {
    subjects[s.subject] = (subjects[s.subject] || 0) + (s.duration_minutes || 0);
  });

  return { totalSessions, totalMinutes, averageDuration, subjects };
};

function StudyStats({ stats }: { stats: StudyStats }) {
  return (
    <div className="study-stats">
      <div className="stat-card">
        <h3>Total Sessions</h3>
        <p>{stats.totalSessions}</p>
      </div>
      <div className="stat-card">
        <h3>Total Minutes</h3>
        <p>{stats.totalMinutes}</p>
      </div>
      <div className="stat-card">
        <h3>Average Duration</h3>
        <p>{Math.round(stats.averageDuration)} min</p>
      </div>
    </div>
  );
}

function SubjectBreakdown({ subjects }: { subjects: Record<string, number> }) {
  return (
    <div className="subject-breakdown">
      <h3>Subject Breakdown</h3>
      {Object.entries(subjects).map(([subject, minutes]) => (
        <div key={subject} className="subject-item">
          <span>{subject}</span>
          <span>{minutes} min</span>
        </div>
      ))}
    </div>
  );
}

function SessionForm({ onSubmit, onCancel }: { 
  onSubmit: (data: Partial<StudySession>) => Promise<void>;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      subject,
      duration_minutes: parseInt(duration),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    });
    setSubject('');
    setDuration('');
  };

  return (
    <form onSubmit={handleSubmit} className="session-form">
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        required
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Duration (minutes)"
        min="1"
        required
      />
      <div className="form-actions">
        <button type="submit">Save Session</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function SessionList({ sessions, onDelete }: {
  sessions: StudySession[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="session-list">
      <h3>Study Sessions</h3>
      {sessions.length === 0 ? (
        <p>No study sessions recorded yet.</p>
      ) : (
        <ul>
          {sessions.map(session => (
            <li key={session.id} className="session-item">
              <div className="session-info">
                <strong>{session.subject}</strong>
                <span>{session.duration_minutes} minutes</span>
                <span>{new Date(session.created_at).toLocaleDateString()}</span>
              </div>
              <button onClick={() => onDelete(session.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StudyTrackerView() {
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    data: sessions,
    loading,
    error,
    create,
    remove,
    refetch
  } = useUserData<StudySession>('study_sessions', {
    orderBy: { column: 'created_at', ascending: false }
  });

  useEffect(() => {
    const loadUser = async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('study-sessions-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'study_sessions',
          filter: `user_id=eq.${userId}`
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, refetch]);

  const handleCreateSession = async (data: Partial<StudySession>) => {
    try {
      await create(data);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  if (loading) return <div>Loading study data...</div>;
  if (error) return <div>Error: {error}</div>;

  const stats = calculateStats(sessions);

  return (
    <div className="study-tracker">
      <h1>Study Tracker</h1>
      
      <StudyStats stats={stats} />
      
      <div className="tracker-actions">
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : 'Add Session'}
        </button>
      </div>

      {showForm && (
        <SessionForm 
          onSubmit={handleCreateSession}
          onCancel={() => setShowForm(false)}
        />
      )}

      <SubjectBreakdown subjects={stats.subjects} />
      
      <SessionList 
        sessions={sessions}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}