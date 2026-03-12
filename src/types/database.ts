export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      gyms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          city: string;
          address: string | null;
          logo_url: string | null;
          website: string | null;
          owner_id: string | null;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          city?: string;
          address?: string | null;
          logo_url?: string | null;
          website?: string | null;
          owner_id?: string | null;
          invite_code?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          city?: string;
          address?: string | null;
          logo_url?: string | null;
          website?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          area: string;
          gym: string;
          avatar: string | null;
          bio: string | null;
          fitness_goals: string[];
          goals: string[];
          created_at: string;
          is_admin: boolean;
          user_role: 'client' | 'trainer' | 'admin' | 'gym';
          bio_expert: string | null;
          hourly_rate: number | null;
          verified_status: boolean;
          rating_avg: number;
          total_reviews: number;
          specialty: string[];
          years_experience: number;
          certifications: string[];
          transformations: string[];
          clients_worked_with: number;
          buffer_minutes: number;
          gym_id: string | null;
          age: number | null;
          gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | null;
          service_type: 'training_only' | 'diet_and_training' | null;
          trainer_type: 'freelancer' | 'gym_affiliated' | null;
          profile_photo_url: string | null;
          city: string;
          testimonials: { name: string; text: string; date?: string }[];
          offers_home_training: boolean;
          home_training_cities: string[];
          offers_diet_plan: boolean;
          last_active_at: string | null;
          onboarding_completed: boolean;
          setup_step_discover: boolean;
          setup_step_inquiry: boolean;
          setup_step_share: boolean;
          referral_code: string | null;
          referred_by: string | null;
          earnings_goal: number | null;
          response_commitment: string;
          health_score: number;
          profile_strength: number;
          total_completed_sessions: number;
          verification_status: 'unverified' | 'pending' | 'approved' | 'rejected';
          verification_submitted_at: string | null;
          verification_reviewed_at: string | null;
          verification_reviewer_id: string | null;
          verification_rejection_reason: string | null;
          legal_name: string | null;
          date_of_birth: string | null;
          current_streak: number;
          longest_streak: number;
          badges: Record<string, unknown>[] | null;
          accepting_bookings: boolean;
          vacation_start: string | null;
          vacation_end: string | null;
          is_active: boolean;
          notification_preferences: Record<string, boolean> | null;
          saved_address: string | null;
          saved_city: string | null;
          saved_phone: string | null;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          area?: string;
          gym?: string;
          avatar?: string | null;
          bio?: string | null;
          fitness_goals?: string[];
          goals?: string[];
          created_at?: string;
          is_admin?: boolean;
          user_role?: 'client' | 'trainer' | 'admin' | 'gym';
          bio_expert?: string | null;
          hourly_rate?: number | null;
          verified_status?: boolean;
          specialty?: string[];
          years_experience?: number;
          certifications?: string[];
          transformations?: string[];
          clients_worked_with?: number;
          gym_id?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | null;
          service_type?: 'training_only' | 'diet_and_training' | null;
          trainer_type?: 'freelancer' | 'gym_affiliated' | null;
          profile_photo_url?: string | null;
          city?: string;
          testimonials?: { name: string; text: string; date?: string }[];
          offers_home_training?: boolean;
          home_training_cities?: string[];
          offers_diet_plan?: boolean;
          last_active_at?: string | null;
          onboarding_completed?: boolean;
          setup_step_discover?: boolean;
          setup_step_inquiry?: boolean;
          setup_step_share?: boolean;
          referral_code?: string | null;
          referred_by?: string | null;
          earnings_goal?: number | null;
          response_commitment?: string;
          health_score?: number;
          profile_strength?: number;
          total_completed_sessions?: number;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          area?: string;
          gym?: string;
          avatar?: string | null;
          bio?: string | null;
          fitness_goals?: string[];
          goals?: string[];
          is_admin?: boolean;
          user_role?: 'client' | 'trainer' | 'admin' | 'gym';
          bio_expert?: string | null;
          hourly_rate?: number | null;
          verified_status?: boolean;
          specialty?: string[];
          years_experience?: number;
          certifications?: string[];
          transformations?: string[];
          clients_worked_with?: number;
          gym_id?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | null;
          service_type?: 'training_only' | 'diet_and_training' | null;
          trainer_type?: 'freelancer' | 'gym_affiliated' | null;
          profile_photo_url?: string | null;
          city?: string;
          testimonials?: { name: string; text: string; date?: string }[];
          offers_home_training?: boolean;
          home_training_cities?: string[];
          offers_diet_plan?: boolean;
          last_active_at?: string | null;
          onboarding_completed?: boolean;
          setup_step_discover?: boolean;
          setup_step_inquiry?: boolean;
          setup_step_share?: boolean;
          referral_code?: string | null;
          referred_by?: string | null;
          earnings_goal?: number | null;
          response_commitment?: string;
          health_score?: number;
          profile_strength?: number;
          total_completed_sessions?: number;
          saved_address?: string | null;
          saved_city?: string | null;
          saved_phone?: string | null;
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
      direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      session_goals: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          title: string;
          is_completed: boolean;
          completed_by: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          title: string;
          is_completed?: boolean;
          completed_by?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string;
          is_completed?: boolean;
          completed_by?: string | null;
          sort_order?: number;
        };
      };
      bookings: {
        Row: {
          id: string;
          client_id: string;
          trainer_id: string;
          course_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          note: string | null;
          student_prep: string | null;
          session_brief: string | null;
          is_recurring: boolean;
          package_id: string | null;
          created_at: string;
          updated_at: string;
          priority_client: boolean;
        };
        Insert: {
          id?: string;
          client_id: string;
          trainer_id: string;
          course_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          note?: string | null;
          student_prep?: string | null;
          is_recurring?: boolean;
          package_id?: string | null;
          priority_client?: boolean;
        };
        Update: {
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          note?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          student_prep?: string | null;
          session_brief?: string | null;
          is_recurring?: boolean;
          priority_client?: boolean;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          client_id: string;
          trainer_id: string;
          rating: number;
          comment: string | null;
          kg_lost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          client_id: string;
          trainer_id: string;
          rating: number;
          comment?: string | null;
          kg_lost?: number | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
          kg_lost?: number | null;
        };
      };
      tutor_requests: {
        Row: {
          id: string;
          student_id: string;
          course_id: string | null;
          title: string;
          description: string | null;
          subject: string | null;
          max_budget: number | null;
          deadline: string | null;
          status: 'open' | 'filled' | 'expired' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id?: string | null;
          title: string;
          description?: string | null;
          subject?: string | null;
          max_budget?: number | null;
          deadline?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: 'open' | 'filled' | 'expired' | 'cancelled';
        };
      };
      tutor_bids: {
        Row: {
          id: string;
          request_id: string;
          tutor_id: string;
          proposed_rate: number | null;
          message: string | null;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          tutor_id: string;
          proposed_rate?: number | null;
          message?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'rejected';
          message?: string | null;
        };
      };
      tutor_verifications: {
        Row: {
          id: string;
          tutor_id: string;
          type: 'transcript' | 'linkedin' | 'background_check' | 'other' | 'id_card' | 'passport';
          document_url: string | null;
          document_path: string | null;
          selfie_path: string | null;
          notes: string | null;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          file_type: string | null;
          created_at: string;
          extracted_data: Record<string, string> | null;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          type: 'transcript' | 'linkedin' | 'background_check' | 'other' | 'id_card' | 'passport';
          document_url?: string | null;
          notes?: string | null;
          extracted_data?: Record<string, string> | null;
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
        };
      };
      tutor_student_notes: {
        Row: {
          id: string;
          tutor_id: string;
          student_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          student_id: string;
          content: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      tutor_packages: {
        Row: {
          id: string;
          tutor_id: string;
          title: string;
          total_hours: number;
          price: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          title: string;
          total_hours: number;
          price: number;
          description?: string | null;
        };
        Update: {
          title?: string;
          total_hours?: number;
          price?: number;
          description?: string | null;
          is_active?: boolean;
        };
      };
      training_packages: {
        Row: {
          id: string;
          trainer_id: string;
          title: string;
          duration_weeks: number;
          sessions_per_week: number;
          price_without_diet: number;
          price_with_diet: number | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          title: string;
          duration_weeks: number;
          sessions_per_week?: number;
          price_without_diet: number;
          price_with_diet?: number | null;
          description?: string | null;
        };
        Update: {
          title?: string;
          duration_weeks?: number;
          sessions_per_week?: number;
          price_without_diet?: number;
          price_with_diet?: number | null;
          description?: string | null;
          is_active?: boolean;
        };
      };
      connections: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          initiated_by: string;
          status: 'pending' | 'active' | 'ignored' | 'blocked';
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          initiated_by: string;
          status?: 'pending' | 'active' | 'ignored' | 'blocked';
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'active' | 'ignored' | 'blocked';
          responded_at?: string | null;
        };
      };
      accountability_pairs: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
        };
        Update: never;
      };
      trainer_challenges: {
        Row: {
          id: string;
          trainer_id: string;
          title: string;
          description: string | null;
          target_sessions: number;
          start_date: string;
          end_date: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          title: string;
          description?: string | null;
          target_sessions?: number;
          start_date: string;
          end_date: string;
          active?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          target_sessions?: number;
          active?: boolean;
        };
      };
      challenge_participants: {
        Row: {
          id: string;
          challenge_id: string;
          client_id: string;
          sessions_completed: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          client_id: string;
          sessions_completed?: number;
        };
        Update: {
          sessions_completed?: number;
        };
      };
      client_progress_photos: {
        Row: {
          id: string;
          client_id: string;
          photo_url: string;
          body_side: 'front' | 'side' | 'back' | 'other';
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          photo_url: string;
          body_side?: 'front' | 'side' | 'back' | 'other';
        };
        Update: {
          body_side?: 'front' | 'side' | 'back' | 'other';
        };
      };
      client_weekly_logs: {
        Row: {
          id: string;
          client_id: string;
          week_start_date: string;
          weight_kg: number | null;
          energy: number | null;
          sleep: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          week_start_date: string;
          weight_kg?: number | null;
          energy?: number | null;
          sleep?: number | null;
          note?: string | null;
        };
        Update: {
          weight_kg?: number | null;
          energy?: number | null;
          sleep?: number | null;
          note?: string | null;
        };
      };
      client_milestones: {
        Row: {
          id: string;
          client_id: string;
          milestone: number;
          celebrated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          milestone: number;
        };
        Update: never;
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string | null;
          source_trainer_id: string | null;
          status: 'pending' | 'converted';
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id?: string | null;
          source_trainer_id?: string | null;
          status?: 'pending' | 'converted';
        };
        Update: {
          status?: 'pending' | 'converted';
          referred_id?: string | null;
        };
      };
      trainer_posts: {
        Row: {
          id: string;
          trainer_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          content: string;
          image_url?: string | null;
        };
        Update: {
          content?: string;
          image_url?: string | null;
        };
      };
      weekly_content: {
        Row: {
          id: string;
          week_number: number;
          year: number;
          theme: string;
          tip_text: string;
          cta_text: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_number: number;
          year: number;
          theme: string;
          tip_text: string;
          cta_text?: string | null;
          active?: boolean;
        };
        Update: {
          theme?: string;
          tip_text?: string;
          cta_text?: string | null;
          active?: boolean;
        };
      };
      seasonal_notifications: {
        Row: {
          id: string;
          title: string;
          body: string;
          trigger_date: string;
          sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          trigger_date: string;
          sent?: boolean;
        };
        Update: {
          sent?: boolean;
        };
      };
      trainer_incidents: {
        Row: {
          id: string;
          trainer_id: string;
          booking_id: string | null;
          type: 'no_show' | 'late_cancel';
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          booking_id?: string | null;
          type: 'no_show' | 'late_cancel';
        };
        Update: never;
      };
      discover_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          city_filter: string | null;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          city_filter?: string | null;
        };
        Update: {
          last_seen_at?: string;
          city_filter?: string | null;
        };
      };
      user_events: {
        Row: {
          id: string;
          user_id: string;
          event_name: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_name: string;
          metadata?: Record<string, unknown>;
        };
        Update: never;
      };
      session_notes: {
        Row: {
          id: string;
          booking_id: string;
          trainer_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          trainer_id: string;
          content?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Convenience type aliases for row types
export type GymRow = Database['public']['Tables']['gyms']['Row'];
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
export type DirectMessageRow = Database['public']['Tables']['direct_messages']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type ConnectionRow = Database['public']['Tables']['connections']['Row'];
export type SessionGoalRow = Database['public']['Tables']['session_goals']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type TutorRequestRow = Database['public']['Tables']['tutor_requests']['Row'];
export type TutorBidRow = Database['public']['Tables']['tutor_bids']['Row'];
export type TutorVerificationRow = Database['public']['Tables']['tutor_verifications']['Row'];
export type TutorStudentNoteRow = Database['public']['Tables']['tutor_student_notes']['Row'];
export type TutorPackageRow = Database['public']['Tables']['tutor_packages']['Row'];
export type TrainingPackageRow = Database['public']['Tables']['training_packages']['Row'];
export type AccountabilityPairRow = Database['public']['Tables']['accountability_pairs']['Row'];
export type TrainerChallengeRow = Database['public']['Tables']['trainer_challenges']['Row'];
export type ChallengeParticipantRow = Database['public']['Tables']['challenge_participants']['Row'];
export type ClientProgressPhotoRow = Database['public']['Tables']['client_progress_photos']['Row'];
export type ClientWeeklyLogRow = Database['public']['Tables']['client_weekly_logs']['Row'];
export type ClientMilestoneRow = Database['public']['Tables']['client_milestones']['Row'];
export type ReferralRow = Database['public']['Tables']['referrals']['Row'];
export type TrainerPostRow = Database['public']['Tables']['trainer_posts']['Row'];
export type WeeklyContentRow = Database['public']['Tables']['weekly_content']['Row'];
export type SeasonalNotificationRow = Database['public']['Tables']['seasonal_notifications']['Row'];
export type TrainerIncidentRow = Database['public']['Tables']['trainer_incidents']['Row'];
export type DiscoverSessionRow = Database['public']['Tables']['discover_sessions']['Row'];
export type UserEventRow = Database['public']['Tables']['user_events']['Row'];
export type SessionNoteRow = Database['public']['Tables']['session_notes']['Row'];
