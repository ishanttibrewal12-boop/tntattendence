export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          full_name: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      advances: {
        Row: {
          amount: number
          created_at: string
          date: string
          deducted_from_payroll_id: string | null
          id: string
          is_deducted: boolean
          notes: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          deducted_from_payroll_id?: string | null
          id?: string
          is_deducted?: boolean
          notes?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          deducted_from_payroll_id?: string | null
          id?: string
          is_deducted?: boolean
          notes?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advances_deducted_from_payroll_id_fkey"
            columns: ["deducted_from_payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          category: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username: string
        }
        Update: {
          category?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          shift_count: number | null
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          shift_count?: number | null
          staff_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          shift_count?: number | null
          staff_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_parties: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_party_transactions: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          litres: number | null
          notes: string | null
          party_id: string
          transaction_type: string
          tyre_name: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          litres?: number | null
          notes?: string | null
          party_id: string
          transaction_type?: string
          tyre_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          litres?: number | null
          notes?: string | null
          party_id?: string
          transaction_type?: string
          tyre_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_party_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "credit_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          photo_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      mlt_advances: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          is_deducted: boolean
          notes: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          is_deducted?: boolean
          notes?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          is_deducted?: boolean
          notes?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mlt_advances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "mlt_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mlt_attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          shift_count: number | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          shift_count?: number | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          shift_count?: number | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mlt_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "mlt_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mlt_staff: {
        Row: {
          address: string | null
          base_salary: number
          category: Database["public"]["Enums"]["mlt_staff_category"]
          created_at: string
          designation: string | null
          id: string
          is_active: boolean
          joining_date: string
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          shift_rate: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_salary?: number
          category?: Database["public"]["Enums"]["mlt_staff_category"]
          created_at?: string
          designation?: string | null
          id?: string
          is_active?: boolean
          joining_date?: string
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          shift_rate?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_salary?: number
          category?: Database["public"]["Enums"]["mlt_staff_category"]
          created_at?: string
          designation?: string | null
          id?: string
          is_active?: boolean
          joining_date?: string
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          shift_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          absent_days: number
          base_salary: number
          bonus: number
          created_at: string
          deductions: number
          half_days: number
          id: string
          is_paid: boolean
          month: number
          net_salary: number
          notes: string | null
          paid_date: string | null
          present_days: number
          staff_id: string
          updated_at: string
          working_days: number
          year: number
        }
        Insert: {
          absent_days?: number
          base_salary?: number
          bonus?: number
          created_at?: string
          deductions?: number
          half_days?: number
          id?: string
          is_paid?: boolean
          month: number
          net_salary?: number
          notes?: string | null
          paid_date?: string | null
          present_days?: number
          staff_id: string
          updated_at?: string
          working_days?: number
          year: number
        }
        Update: {
          absent_days?: number
          base_salary?: number
          bonus?: number
          created_at?: string
          deductions?: number
          half_days?: number
          id?: string
          is_paid?: boolean
          month?: number
          net_salary?: number
          notes?: string | null
          paid_date?: string | null
          present_days?: number
          staff_id?: string
          updated_at?: string
          working_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      petroleum_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          notes: string | null
          payment_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      petroleum_sales: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          notes: string | null
          sale_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          sale_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          sale_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          is_sent: boolean
          message: string | null
          reminder_date: string
          reminder_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sent?: boolean
          message?: string | null
          reminder_date: string
          reminder_time?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sent?: boolean
          message?: string | null
          reminder_date?: string
          reminder_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          created_at: string
          gross_salary: number | null
          id: string
          is_paid: boolean | null
          month: number
          notes: string | null
          paid_date: string | null
          pending_amount: number | null
          shift_rate: number | null
          staff_id: string
          staff_type: string
          total_advances: number | null
          total_paid: number | null
          total_shifts: number | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          gross_salary?: number | null
          id?: string
          is_paid?: boolean | null
          month: number
          notes?: string | null
          paid_date?: string | null
          pending_amount?: number | null
          shift_rate?: number | null
          staff_id: string
          staff_type: string
          total_advances?: number | null
          total_paid?: number | null
          total_shifts?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          gross_salary?: number | null
          id?: string
          is_paid?: boolean | null
          month?: number
          notes?: string | null
          paid_date?: string | null
          pending_amount?: number | null
          shift_rate?: number | null
          staff_id?: string
          staff_type?: string
          total_advances?: number | null
          total_paid?: number | null
          total_shifts?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          base_salary: number
          category: Database["public"]["Enums"]["staff_category"]
          created_at: string
          designation: string | null
          id: string
          is_active: boolean
          joining_date: string
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          shift_rate: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_salary?: number
          category?: Database["public"]["Enums"]["staff_category"]
          created_at?: string
          designation?: string | null
          id?: string
          is_active?: boolean
          joining_date?: string
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          shift_rate?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_salary?: number
          category?: Database["public"]["Enums"]["staff_category"]
          created_at?: string
          designation?: string | null
          id?: string
          is_active?: boolean
          joining_date?: string
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          shift_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tyre_sales: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "mlt_admin" | "petroleum_admin" | "crusher_admin"
      attendance_status:
        | "present"
        | "absent"
        | "half_day"
        | "holiday"
        | "sunday"
        | "leave"
        | "not_marked"
      mlt_staff_category: "driver" | "khalasi"
      staff_category: "petroleum" | "crusher" | "office"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager", "mlt_admin", "petroleum_admin", "crusher_admin"],
      attendance_status: [
        "present",
        "absent",
        "half_day",
        "holiday",
        "sunday",
        "leave",
        "not_marked",
      ],
      mlt_staff_category: ["driver", "khalasi"],
      staff_category: ["petroleum", "crusher", "office"],
    },
  },
} as const
