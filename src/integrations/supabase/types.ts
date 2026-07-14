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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          cta_label: string
          cta_link: string
          ends_at: string | null
          eyebrow: string
          id: string
          image_url: string
          sort_order: number
          starts_at: string | null
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_label?: string
          cta_link?: string
          ends_at?: string | null
          eyebrow?: string
          id?: string
          image_url: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_label?: string
          cta_link?: string
          ends_at?: string | null
          eyebrow?: string
          id?: string
          image_url?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          min_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          full_name: string | null
          id: string
          is_default: boolean
          label: string | null
          phone: string | null
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          full_name?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string | null
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          full_name?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string | null
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          note: string
          profile_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          note: string
          profile_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          note?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      instagram_reels: {
        Row: {
          active: boolean
          caption: string
          created_at: string
          id: string
          reel_url: string
          sort_order: number
          thumbnail_url: string | null
        }
        Insert: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          reel_url: string
          sort_order?: number
          thumbnail_url?: string | null
        }
        Update: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          reel_url?: string
          sort_order?: number
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string | null
          channel: string
          error: string | null
          id: string
          sent_at: string
          status: string
          subject: string | null
          target: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          error?: string | null
          id?: string
          sent_at?: string
          status?: string
          subject?: string | null
          target?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          error?: string | null
          id?: string
          sent_at?: string
          status?: string
          subject?: string | null
          target?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          channel: string
          enabled: boolean
          key: string
          subject: string | null
          template: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          enabled?: boolean
          key: string
          subject?: string | null
          template?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          enabled?: boolean
          key?: string
          subject?: string | null
          template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image: string | null
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          product_slug: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          quantity?: number
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
        ]
      }
      orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount: number
          dispatch_date: string | null
          estimated_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          pincode: string
          shipping: number
          shipping_notes: string | null
          state: string
          status: string
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount?: number
          dispatch_date?: string | null
          estimated_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          pincode: string
          shipping?: number
          shipping_notes?: string | null
          state: string
          status?: string
          subtotal: number
          tax?: number
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          dispatch_date?: string | null
          estimated_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          pincode?: string
          shipping?: number
          shipping_notes?: string | null
          state?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          body: string
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_stock_meta: {
        Row: {
          low_stock_threshold: number
          product_id: string
          reserved: number
          updated_at: string
        }
        Insert: {
          low_stock_threshold?: number
          product_id: string
          reserved?: number
          updated_at?: string
        }
        Update: {
          low_stock_threshold?: number
          product_id?: string
          reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_meta_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_slug: string
          created_at: string
          description: string | null
          id: string
          images: string[]
          is_bestseller: boolean
          is_featured: boolean
          is_new: boolean
          name: string
          original_price: number | null
          price: number
          rating: number
          review_count: number
          slug: string
          stock: number
          tags: string[]
        }
        Insert: {
          category_slug: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_bestseller?: boolean
          is_featured?: boolean
          is_new?: boolean
          name: string
          original_price?: number | null
          price: number
          rating?: number
          review_count?: number
          slug: string
          stock?: number
          tags?: string[]
        }
        Update: {
          category_slug?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_bestseller?: boolean
          is_featured?: boolean
          is_new?: boolean
          name?: string
          original_price?: number | null
          price?: number
          rating?: number
          review_count?: number
          slug?: string
          stock?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          blocked: boolean
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          blocked?: boolean
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_entries: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          purchase_date: string
          quantity: number
          supplier_id: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          purchase_date?: string
          quantity: number
          supplier_id?: string | null
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          purchase_date?: string
          quantity?: number
          supplier_id?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved?: boolean
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved?: boolean
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_entries: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          ref_id: string
          robots: string | null
          schema_json: Json | null
          scope: string
          twitter_card: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          ref_id?: string
          robots?: string | null
          schema_json?: Json | null
          scope: string
          twitter_card?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          ref_id?: string
          robots?: string | null
          schema_json?: Json | null
          scope?: string
          twitter_card?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          delta: number
          id: string
          note: string | null
          product_id: string
          reason: string
          reference_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          note?: string | null
          product_id: string
          reason?: string
          reference_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          note?: string | null
          product_id?: string
          reason?: string
          reference_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      customer_stats: {
        Args: { _user_id: string }
        Returns: {
          last_order_at: string
          total_orders: number
          total_spent: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "customer"
        | "manager"
        | "staff"
        | "readonly"
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
      app_role: [
        "super_admin",
        "admin",
        "customer",
        "manager",
        "staff",
        "readonly",
      ],
    },
  },
} as const
