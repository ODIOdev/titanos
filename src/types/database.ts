export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          company: string | null;
          phone: string | null;
          state: string | null;
          postal_code: string | null;
          date_of_birth: string | null;
          role: string;
          is_owner: boolean;
          account_status: string | null;
          avatar_url: string | null;
          promo_code: string | null;
          affiliate_coupon_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          company?: string | null;
          phone?: string | null;
          state?: string | null;
          postal_code?: string | null;
          date_of_birth?: string | null;
          role?: string;
          is_owner?: boolean;
          account_status?: string | null;
          avatar_url?: string | null;
          promo_code?: string | null;
          affiliate_coupon_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          brand_id: string | null;
          name: string;
          slug: string;
          sku: string;
          short_description: string | null;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          cost: number | null;
          inventory_quantity: number;
          low_stock_threshold: number;
          featured: boolean;
          bestseller: boolean;
          active: boolean;
          weight: number | null;
          shipping_class: string | null;
          rating_avg: number;
          rating_count: number;
          ansi_class: string | null;
          color: string | null;
          size: string | null;
          product_type: string | null;
          department: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          name: string;
          slug: string;
          sku: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          parent_id: string | null;
          sort_order: number;
          active: boolean;
          sku_prefix: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["brands"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
      Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
      Relationships: [];
      };
      product_specifications: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          value: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          value: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_specifications"]["Insert"]>;
      Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
      Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
      Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
      Relationships: [];
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: { id?: string; wishlist_id: string; product_id: string };
        Update: Partial<Database["public"]["Tables"]["wishlist_items"]["Insert"]>;
      Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          email: string;
          status: string;
          payment_status: string;
          fulfillment_status: string;
          subtotal: number;
          shipping_amount: number;
          tax_amount: number;
          discount_amount: number;
          total: number;
          currency: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          notes: string | null;
          internal_notes: string | null;
          coupon_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          order_number: string;
          email: string;
          subtotal: number;
          total: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          sku: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          options: Json | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          sku: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          options?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
      Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          user_id: string | null;
          contact_name: string;
          company: string | null;
          ein: string | null;
          email: string;
          phone: string | null;
          industry: string | null;
          project_name: string | null;
          requested_delivery_date: string | null;
          urgency: string | null;
          shipping_address: Json | null;
          tax_exempt: boolean;
          notes: string | null;
          custom_product_description: string | null;
          status: string;
          internal_notes: string | null;
          subtotal: number | null;
          discount_amount: number | null;
          shipping_amount: number | null;
          tax_amount: number | null;
          total: number | null;
          expires_at: string | null;
          converted_order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]> & {
          quote_number: string;
          contact_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
      Relationships: [];
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_id: string | null;
          product_name: string;
          sku: string | null;
          quantity: number;
          unit_price: number | null;
          notes: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          quote_id: string;
          product_id?: string | null;
          product_name: string;
          sku?: string | null;
          quantity: number;
          unit_price?: number | null;
          notes?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>;
      Relationships: [];
      };
      quote_attachments: {
        Row: {
          id: string;
          quote_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quote_attachments"]["Insert"]>;
      Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          verified_purchase: boolean;
          approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          verified_purchase?: boolean;
          approved?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          active: boolean;
          created_at: string;
        };
        Insert: { id?: string; email: string; active?: boolean };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
      Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          cover_image: string | null;
          file_path: string | null;
          category: string | null;
          published: boolean;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resources"]["Row"]> & {
          title: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Insert"]>;
      Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          type: "shipping" | "billing";
          is_default: boolean;
          first_name: string;
          last_name: string;
          company: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["addresses"]["Row"]> & {
          user_id: string;
          type: "shipping" | "billing";
          first_name: string;
          last_name: string;
          line1: string;
          city: string;
          state: string;
          postal_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: { id?: string; key: string; value: Json };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          quantity_change: number;
          reason: string;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          quantity_change: number;
          reason: string;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Insert"]>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          min_order_amount: number | null;
          max_uses: number | null;
          used_count: number;
          active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          owner_user_id: string | null;
          is_affiliate: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          min_order_amount?: number | null;
          max_uses?: number | null;
          used_count?: number;
          active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          owner_user_id?: string | null;
          is_affiliate?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
        Relationships: [];
      };
      affiliate_applications: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          contact_name: string;
          email: string;
          phone: string | null;
          company: string | null;
          audience: string;
          motivation: string | null;
          agreed_to_terms: boolean;
          orders_at_apply: number;
          admin_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          audience: string;
          motivation?: string | null;
          agreed_to_terms?: boolean;
          orders_at_apply?: number;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["affiliate_applications"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff_or_admin: { Args: Record<string, never>; Returns: boolean };
      apply_affiliate_discounts: {
        Args: { p_customer_percent: number; p_admin_percent: number };
        Returns: number;
      };
      ensure_affiliate_promo_for_profile: {
        Args: { p_profile_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
