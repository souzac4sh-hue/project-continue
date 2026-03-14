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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      checkout_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["checkout_event_type"]
          id: string
          identifier: string | null
          metadata: Json | null
          order_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["checkout_event_type"]
          id?: string
          identifier?: string | null
          metadata?: Json | null
          order_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["checkout_event_type"]
          id?: string
          identifier?: string | null
          metadata?: Json | null
          order_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          times_used: number | null
          usage_limit: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          times_used?: number | null
          usage_limit?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          times_used?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      ninja_coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_percentage: number
          expires_at: string
          id: string
          is_used: boolean
          max_uses: number
          product_id: string | null
          session_id: string | null
          source: string
          status: string
          used_at: string | null
          visitor_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_percentage: number
          expires_at?: string
          id?: string
          is_used?: boolean
          max_uses?: number
          product_id?: string | null
          session_id?: string | null
          source?: string
          status?: string
          used_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_percentage?: number
          expires_at?: string
          id?: string
          is_used?: boolean
          max_uses?: number
          product_id?: string | null
          session_id?: string | null
          source?: string
          status?: string
          used_at?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      pix_orders: {
        Row: {
          abandoned_at: string | null
          amount: number
          copied_at: string | null
          copied_pix: boolean | null
          coupon_code: string | null
          created_at: string
          customer_document: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          gateway_status: string | null
          id: string
          identifier: string
          last_step: string | null
          lead_status: Database["public"]["Enums"]["lead_status"] | null
          notes: string | null
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pix_amount: number | null
          pix_code: string | null
          product_id: string
          product_name: string
          product_price: number | null
          provider: string | null
          provider_identifier: string | null
          provider_response: Json | null
          recovered_at: string | null
          recovery_status: Database["public"]["Enums"]["recovery_status"] | null
          support_contacted_at: string | null
        }
        Insert: {
          abandoned_at?: string | null
          amount: number
          copied_at?: string | null
          copied_pix?: boolean | null
          coupon_code?: string | null
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          discount_amount?: number | null
          gateway_status?: string | null
          id?: string
          identifier: string
          last_step?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pix_amount?: number | null
          pix_code?: string | null
          product_id: string
          product_name: string
          product_price?: number | null
          provider?: string | null
          provider_identifier?: string | null
          provider_response?: Json | null
          recovered_at?: string | null
          recovery_status?:
            | Database["public"]["Enums"]["recovery_status"]
            | null
          support_contacted_at?: string | null
        }
        Update: {
          abandoned_at?: string | null
          amount?: number
          copied_at?: string | null
          copied_pix?: boolean | null
          coupon_code?: string | null
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          discount_amount?: number | null
          gateway_status?: string | null
          id?: string
          identifier?: string
          last_step?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pix_amount?: number | null
          pix_code?: string | null
          product_id?: string
          product_name?: string
          product_price?: number | null
          provider?: string | null
          provider_identifier?: string | null
          provider_response?: Json | null
          recovered_at?: string | null
          recovery_status?:
            | Database["public"]["Enums"]["recovery_status"]
            | null
          support_contacted_at?: string | null
        }
        Relationships: []
      }
      recovery_messages: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          is_default: boolean | null
          sort_order: number | null
          template: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          sort_order?: number | null
          template: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          sort_order?: number | null
          template?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      recovery_settings: {
        Row: {
          abandonment_timeout_minutes: number | null
          id: string
          mark_hot_on_copy: boolean | null
          show_regenerate_pix: boolean | null
          show_support_button: boolean | null
          updated_at: string
        }
        Insert: {
          abandonment_timeout_minutes?: number | null
          id?: string
          mark_hot_on_copy?: boolean | null
          show_regenerate_pix?: boolean | null
          show_support_button?: boolean | null
          updated_at?: string
        }
        Update: {
          abandonment_timeout_minutes?: number | null
          id?: string
          mark_hot_on_copy?: boolean | null
          show_regenerate_pix?: boolean | null
          show_support_button?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          settings?: Json | null
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
      get_pix_order_status: {
        Args: { order_identifier: string }
        Returns: {
          gateway_status: string
          paid_at: string
          payment_status: string
          provider_identifier: string
        }[]
      }
      get_public_site_config: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      checkout_event_type:
        | "form_submitted"
        | "pix_generated"
        | "pix_copied"
        | "support_clicked"
        | "new_pix_generated"
        | "payment_confirmed"
        | "order_abandoned"
        | "whatsapp_redirected"
        | "pix_expired"
        | "pix_screen_opened"
      lead_status:
        | "started"
        | "pix_generated"
        | "pix_copied"
        | "awaiting_payment"
        | "abandoned"
        | "support_requested"
        | "recovered"
        | "paid"
        | "expired"
      payment_status: "pending" | "paid" | "failed" | "expired"
      recovery_status:
        | "pending"
        | "in_progress"
        | "no_response"
        | "recovered"
        | "lost"
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
      app_role: ["admin", "moderator", "user"],
      checkout_event_type: [
        "form_submitted",
        "pix_generated",
        "pix_copied",
        "support_clicked",
        "new_pix_generated",
        "payment_confirmed",
        "order_abandoned",
        "whatsapp_redirected",
        "pix_expired",
        "pix_screen_opened",
      ],
      lead_status: [
        "started",
        "pix_generated",
        "pix_copied",
        "awaiting_payment",
        "abandoned",
        "support_requested",
        "recovered",
        "paid",
        "expired",
      ],
      payment_status: ["pending", "paid", "failed", "expired"],
      recovery_status: [
        "pending",
        "in_progress",
        "no_response",
        "recovered",
        "lost",
      ],
    },
  },
} as const
