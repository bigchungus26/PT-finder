export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          school: string;
          major: string;
          year: string;
          avatar: string | null;
          bio: string | null;
          study_style: string[];
          goals: string[];
          created_at: string;
          is_admin: boolean;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          school?: string;
          major?: string;
          year?: string;
          avatar?: string | null;
          bio?: string | null;
          study_style?: string[];
          goals?: string[];
          created_at?: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          school?: string;
          major?: string;
          year?: string;
          avatar?: string | null;
          bio?: string | null;
          study_style?: string[];
          goals?: string[];
          is_admin?: boolean;
        };
      };
      courses: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          professor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          professor?: string | null;
        };
        Update: {
          code?: string;
          title?: string;
          description?: string | null;
          professor?: string | null;
        };
      };
      user_courses: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          enrolled_at?: string;
        };
        Update: {
          user_id?: string;
          course_id?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          day: string;
          start_time: string;
          end_time: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day: string;
          start_time: string;
          end_time: string;
        };
        Update: {
          day?: string;
          start_time?: string;
          end_time?: string;
        };
      };
      study_groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          course_id: string;
          max_members: number;
          level: string;
          tags: string[];
          rules: string | null;
          is_public: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          course_id: string;
          max_members?: number;
          level?: string;
          tags?: string[];
          rules?: string | null;
          is_public?: boolean;
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string;
          max_members?: number;
          level?: string;
          tags?: string[];
          rules?: string | null;
          is_public?: boolean;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          role?: string;
        };
      };
      group_join_requests: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          message: string | null;
          status: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          message?: string | null;
          status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          message?: string | null;
          status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      sessions: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          description: string | null;
          date: string;
          start_time: string;
          end_time: string;
          location: string | null;
          is_online: boolean;
          meeting_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          description?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          location?: string | null;
          is_online?: boolean;
          meeting_link?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          is_online?: boolean;
          meeting_link?: string | null;
        };
      };
      session_attendees: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          status: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
      agenda_items: {
        Row: {
          id: string;
          session_id: string;
          title: string;
          duration: number;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          title: string;
          duration?: number;
          description?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string;
          duration?: number;
          description?: string | null;
          sort_order?: number;
        };
      };
      questions: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          title: string;
          content: string;
          tags: string[];
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          title: string;
          content: string;
          tags?: string[];
          is_resolved?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          tags?: string[];
          is_resolved?: boolean;
        };
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          content: string;
          is_accepted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id: string;
          content: string;
          is_accepted?: boolean;
        };
        Update: {
          content?: string;
          is_accepted?: boolean;
        };
      };
      question_votes: {
        Row: {
          question_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          question_id: string;
          user_id: string;
        };
        Update: never;
      };
      answer_votes: {
        Row: {
          answer_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          answer_id: string;
          user_id: string;
        };
        Update: never;
      };
      chat_messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string;
          is_pinned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          content: string;
          is_pinned?: boolean;
        };
        Update: {
          content?: string;
          is_pinned?: boolean;
        };
      };
      resources: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: string;
          url: string | null;
          course_id: string | null;
          group_id: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type?: string;
          url?: string | null;
          course_id?: string | null;
          group_id?: string | null;
          user_id: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          type?: string;
          url?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_group_id: string | null;
          reason: string;
          description: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_group_id?: string | null;
          reason: string;
          description?: string;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
    };
  };
}

// Convenience type aliases for row types
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type UserCourseRow = Database['public']['Tables']['user_courses']['Row'];
export type AvailabilityRow = Database['public']['Tables']['availability']['Row'];
export type StudyGroupRow = Database['public']['Tables']['study_groups']['Row'];
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];
export type GroupJoinRequestRow = Database['public']['Tables']['group_join_requests']['Row'];
export type SessionRow = Database['public']['Tables']['sessions']['Row'];
export type SessionAttendeeRow = Database['public']['Tables']['session_attendees']['Row'];
export type AgendaItemRow = Database['public']['Tables']['agenda_items']['Row'];
export type QuestionRow = Database['public']['Tables']['questions']['Row'];
export type AnswerRow = Database['public']['Tables']['answers']['Row'];
export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ReportRow = Database['public']['Tables']['reports']['Row'];
