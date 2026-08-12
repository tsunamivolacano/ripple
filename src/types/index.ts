export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          duration_minutes: number;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string;
          created_at: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          event_date: string;
          description: string | null;
          created_at: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: Record<string, any> | null;
          created_at: string;
        };
      };
    };
  };
}