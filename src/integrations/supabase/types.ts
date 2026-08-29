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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          admin_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string | null
          id: string
          ip: string | null
          module: string
          new_value: Json | null
          previous_value: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          module: string
          new_value?: Json | null
          previous_value?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          module?: string
          new_value?: Json | null
          previous_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_login_attempts: {
        Row: {
          created_at: string
          email_normalized: string | null
          id: string
          ip: string | null
          reason: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email_normalized?: string | null
          id?: string
          ip?: string | null
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email_normalized?: string | null
          id?: string
          ip?: string | null
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_password_resets: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_password_resets_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_security_events: {
        Row: {
          actor_email: string | null
          admin_user_id: string | null
          created_at: string
          event: string
          id: string
          ip: string | null
          metadata: Json
          resource: string | null
          result: string
          severity: string
          user_agent: string | null
        }
        Insert: {
          actor_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          event: string
          id?: string
          ip?: string | null
          metadata?: Json
          resource?: string | null
          result?: string
          severity?: string
          user_agent?: string | null
        }
        Update: {
          actor_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          event?: string
          id?: string
          ip?: string | null
          metadata?: Json
          resource?: string | null
          result?: string
          severity?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_security_events_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          csrf_token_hash: string
          device_label: string | null
          expires_at: string
          id: string
          ip: string | null
          last_active_at: string
          mfa_verified: boolean
          revoked_at: string | null
          token_hash: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          csrf_token_hash: string
          device_label?: string | null
          expires_at: string
          id?: string
          ip?: string | null
          last_active_at?: string
          mfa_verified?: boolean
          revoked_at?: string | null
          token_hash: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          csrf_token_hash?: string
          device_label?: string | null
          expires_at?: string
          id?: string
          ip?: string | null
          last_active_at?: string
          mfa_verified?: boolean
          revoked_at?: string | null
          token_hash?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          email_normalized: string
          failed_login_count: number
          id: string
          last_login_at: string | null
          locked_until: string | null
          mfa_backup_codes: string[]
          mfa_enabled: boolean
          mfa_required: boolean
          mfa_secret: string | null
          must_change_password: boolean
          name: string
          password_changed_at: string
          password_hash: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_normalized: string
          failed_login_count?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          mfa_backup_codes?: string[]
          mfa_enabled?: boolean
          mfa_required?: boolean
          mfa_secret?: string | null
          must_change_password?: boolean
          name?: string
          password_changed_at?: string
          password_hash: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_normalized?: string
          failed_login_count?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          mfa_backup_codes?: string[]
          mfa_enabled?: boolean
          mfa_required?: boolean
          mfa_secret?: string | null
          must_change_password?: boolean
          name?: string
          password_changed_at?: string
          password_hash?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          addresses: Json
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          addresses?: Json
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          addresses?: Json
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          lens_type: string | null
          order_id: string
          prescription_id: string | null
          price: number
          product_id: string | null
          quantity: number
          title: string
          updated_at: string
          variant_id: string | null
          variant_title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lens_type?: string | null
          order_id: string
          prescription_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
          title: string
          updated_at?: string
          variant_id?: string | null
          variant_title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lens_type?: string | null
          order_id?: string
          prescription_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
          title?: string
          updated_at?: string
          variant_id?: string | null
          variant_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          id: string
          notes: string | null
          order_number: string
          payment_status: string
          pincode: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          shopify_order_id: string | null
          state: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_status?: string
          pincode: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shopify_order_id?: string | null
          state: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_status?: string
          pincode?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shopify_order_id?: string | null
          state?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          left_add: number | null
          left_axis: number | null
          left_cyl: number | null
          left_pd: number | null
          left_sph: number | null
          notes: string | null
          pd: number | null
          pd_type: string | null
          photo_url: string | null
          product_type: string
          right_add: number | null
          right_axis: number | null
          right_cyl: number | null
          right_pd: number | null
          right_sph: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          left_add?: number | null
          left_axis?: number | null
          left_cyl?: number | null
          left_pd?: number | null
          left_sph?: number | null
          notes?: string | null
          pd?: number | null
          pd_type?: string | null
          photo_url?: string | null
          product_type?: string
          right_add?: number | null
          right_axis?: number | null
          right_cyl?: number | null
          right_pd?: number | null
          right_sph?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          left_add?: number | null
          left_axis?: number | null
          left_cyl?: number | null
          left_pd?: number | null
          left_sph?: number | null
          notes?: string | null
          pd?: number | null
          pd_type?: string | null
          photo_url?: string | null
          product_type?: string
          right_add?: number | null
          right_axis?: number | null
          right_cyl?: number | null
          right_pd?: number | null
          right_sph?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          updated_at: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          updated_at?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          inventory_quantity: number
          options: Json
          position: number
          price: number
          product_id: string
          sku: string | null
          title: string
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          inventory_quantity?: number
          options?: Json
          position?: number
          price: number
          product_id: string
          sku?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          inventory_quantity?: number
          options?: Json
          position?: number
          price?: number
          product_id?: string
          sku?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          category_id: string | null
          colors: string[]
          compare_at_price: number | null
          created_at: string
          description: string | null
          featured: boolean
          frame_shape: string | null
          gender: string[]
          handle: string
          id: string
          material: string | null
          product_type: string
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          base_price: number
          brand?: string | null
          category_id?: string | null
          colors?: string[]
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          frame_shape?: string | null
          gender?: string[]
          handle: string
          id?: string
          material?: string | null
          product_type?: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          brand?: string | null
          category_id?: string | null
          colors?: string[]
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          frame_shape?: string | null
          gender?: string[]
          handle?: string
          id?: string
          material?: string | null
          product_type?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
