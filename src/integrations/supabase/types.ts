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
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
