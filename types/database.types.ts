export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          email: string | null
          avatar_url: string | null
          default_role: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          default_role?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          default_role?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      schools: {
        Row: {
          id: string
          founder_id: string
          name: string
          type: string
          address: string | null
          city: string | null
          province: string | null
          country: string
          phone: string | null
          email: string | null
          logo_url: string | null
          logo_watermark_opacity: number
          motto: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          name: string
          type: string
          address?: string | null
          city?: string | null
          province?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          logo_watermark_opacity?: number
          motto?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: string
          address?: string | null
          city?: string | null
          province?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          logo_watermark_opacity?: number
          motto?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      school_years: {
        Row: {
          id: string
          school_id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
        }
        Update: {
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
        }
      }
      terms: {
        Row: {
          id: string
          school_id: string
          school_year_id: string
          name: string
          type: 'trimestre' | 'semestre'
          start_date: string
          end_date: string
          is_active: boolean
        }
        Insert: {
          id?: string
          school_id: string
          school_year_id: string
          name: string
          type: 'trimestre' | 'semestre'
          start_date: string
          end_date: string
          is_active?: boolean
        }
        Update: {
          name?: string
          type?: 'trimestre' | 'semestre'
          start_date?: string
          end_date?: string
          is_active?: boolean
        }
      }
      classes: {
        Row: {
          id: string
          school_id: string
          school_year_id: string
          level_id: string
          name: string
          main_teacher_id: string | null
          capacity: number | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          school_year_id: string
          level_id: string
          name: string
          main_teacher_id?: string | null
          capacity?: number | null
          created_at?: string
        }
        Update: {
          name?: string
          main_teacher_id?: string | null
          capacity?: number | null
        }
      }
      students: {
        Row: {
          id: string
          school_id: string
          iun: string
          first_name: string
          last_name: string
          birth_date: string
          birth_place: string | null
          gender: 'M' | 'F'
          cnib_number: string | null
          phone: string | null
          photo_url: string | null
          status: 'pending' | 'active' | 'rejected' | 'transferred' | 'inactive'
          has_personal_phone: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          iun: string
          first_name: string
          last_name: string
          birth_date: string
          birth_place?: string | null
          gender: 'M' | 'F'
          cnib_number?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: 'pending' | 'active' | 'rejected' | 'transferred' | 'inactive'
          has_personal_phone?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string
          last_name?: string
          birth_date?: string
          birth_place?: string | null
          gender?: 'M' | 'F'
          cnib_number?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: 'pending' | 'active' | 'rejected' | 'transferred' | 'inactive'
          has_personal_phone?: boolean
          updated_at?: string
        }
      }
      student_enrollments: {
        Row: {
          id: string
          school_id: string
          student_id: string
          class_id: string
          school_year_id: string
          status: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          school_id: string
          student_id: string
          class_id: string
          school_year_id: string
          status?: string
          enrolled_at?: string
        }
        Update: {
          status?: string
        }
      }
      assessments: {
        Row: {
          id: string
          school_id: string
          school_year_id: string
          term_id: string
          class_id: string
          subject_id: string
          teacher_id: string
          title: string
          type: 'devoir' | 'interrogation' | 'composition' | 'examen'
          coefficient: number
          assessment_date: string
          is_locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          school_year_id: string
          term_id: string
          class_id: string
          subject_id: string
          teacher_id: string
          title: string
          type: 'devoir' | 'interrogation' | 'composition' | 'examen'
          coefficient: number
          assessment_date: string
          is_locked?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          type?: 'devoir' | 'interrogation' | 'composition' | 'examen'
          coefficient?: number
          assessment_date?: string
          is_locked?: boolean
        }
      }
      grades: {
        Row: {
          id: string
          school_id: string
          assessment_id: string
          student_id: string
          grade: number
          appreciation: string | null
          created_by: string
          updated_by: string | null
          is_locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          assessment_id: string
          student_id: string
          grade: number
          appreciation?: string | null
          created_by: string
          updated_by?: string | null
          is_locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          grade?: number
          appreciation?: string | null
          updated_by?: string | null
          is_locked?: boolean
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          school_id: string
          school_year_id: string
          class_id: string
          subject_id: string
          student_id: string
          teacher_id: string
          timetable_slot_id: string | null
          status: 'present' | 'absent' | 'late' | 'sick' | 'excused'
          recorded_at: string
          source: 'web' | 'backup_sms' | 'manual' | 'offline_sync'
          sync_status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          school_year_id: string
          class_id: string
          subject_id: string
          student_id: string
          teacher_id: string
          timetable_slot_id?: string | null
          status: 'present' | 'absent' | 'late' | 'sick' | 'excused'
          recorded_at?: string
          source?: 'web' | 'backup_sms' | 'manual' | 'offline_sync'
          sync_status?: string | null
          created_at?: string
        }
        Update: {
          status?: 'present' | 'absent' | 'late' | 'sick' | 'excused'
          sync_status?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          school_id: string
          student_id: string
          parent_user_id: string | null
          amount: number
          payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'other'
          status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
          reference: string | null
          paid_at: string | null
          recorded_by: string
        }
        Insert: {
          id?: string
          school_id: string
          student_id: string
          parent_user_id?: string | null
          amount: number
          payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'other'
          status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
          reference?: string | null
          paid_at?: string | null
          recorded_by: string
        }
        Update: {
          amount?: number
          payment_method?: 'cash' | 'mobile_money' | 'bank_transfer' | 'other'
          status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
          reference?: string | null
          paid_at?: string | null
        }
      }
      report_cards: {
        Row: {
          id: string
          school_id: string
          school_year_id: string
          term_id: string
          student_id: string
          class_id: string
          template_id: string | null
          average: number | null
          rank: number | null
          appreciation: string | null
          pdf_url: string | null
          qr_hash: string | null
          serial_number: string
          status: 'draft' | 'generated' | 'validated' | 'published' | 'archived'
          generated_by: string | null
          validated_by: string | null
          generated_at: string | null
          validated_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          school_year_id: string
          term_id: string
          student_id: string
          class_id: string
          template_id?: string | null
          average?: number | null
          rank?: number | null
          appreciation?: string | null
          pdf_url?: string | null
          qr_hash?: string | null
          serial_number: string
          status?: 'draft' | 'generated' | 'validated' | 'published' | 'archived'
          generated_by?: string | null
          validated_by?: string | null
          generated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          average?: number | null
          rank?: number | null
          appreciation?: string | null
          pdf_url?: string | null
          qr_hash?: string | null
          status?: 'draft' | 'generated' | 'validated' | 'published' | 'archived'
          validated_by?: string | null
          validated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          school_id: string
          user_id: string
          title: string
          body: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          user_id: string
          title: string
          body: string
          type: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          school_id: string | null
          actor_id: string
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          actor_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
      user_school_roles: {
        Row: {
          id: string
          user_id: string
          school_id: string
          role_code: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          role_code: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          role_code?: string
          is_active?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          school_id: string
          sender_id: string
          subject: string
          body: string
          message_type: 'text' | 'audio'
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          sender_id: string
          subject: string
          body: string
          message_type?: 'text' | 'audio'
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          subject?: string
          body?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          school_id: string
          participant_one: string
          participant_two: string
          last_message_at: string
          last_message_preview: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          participant_one: string
          participant_two: string
          last_message_at?: string
          last_message_preview?: string | null
          created_at?: string
        }
        Update: {
          last_message_at?: string
          last_message_preview?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string | null
          message_type: 'text' | 'audio' | 'image' | 'file'
          attachment_url: string | null
          attachment_name: string | null
          attachment_mime: string | null
          attachment_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body?: string | null
          message_type?: 'text' | 'audio' | 'image' | 'file'
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_mime?: string | null
          attachment_size?: number | null
          created_at?: string
        }
        Update: {
          body?: string | null
        }
      }
      chat_participant_state: {
        Row: {
          conversation_id: string
          user_id: string
          last_read_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          last_read_at?: string
        }
        Update: {
          last_read_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          school_id: string
          title: string
          content: string
          target_type: 'all' | 'class' | 'parents' | 'staff' | 'students'
          target_id: string | null
          published_by: string
          published_at: string
        }
        Insert: {
          id?: string
          school_id: string
          title: string
          content: string
          target_type: 'all' | 'class' | 'parents' | 'staff' | 'students'
          target_id?: string | null
          published_by: string
          published_at?: string
        }
        Update: {
          title?: string
          content?: string
          target_type?: 'all' | 'class' | 'parents' | 'staff' | 'students'
          target_id?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      has_school_role: {
        Args: { p_school_id: string; p_role: string }
        Returns: boolean
      }
      has_any_school_role: {
        Args: { p_school_id: string; p_roles: string[] }
        Returns: boolean
      }
      can_access_school: {
        Args: { p_school_id: string }
        Returns: boolean
      }
      is_parent_of_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      is_student_owner: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      get_my_unread_chat_count: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
