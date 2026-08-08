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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          postal_code: string
          street: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          postal_code: string
          street: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          postal_code?: string
          street?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          created_at: string
          id: string
          product_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          id: string
          product_id: string
          quantity: number
          stitcher_slug: string | null
          stitching_addon_paisa: number | null
          stitching_label: string | null
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          product_id: string
          quantity?: number
          stitcher_slug?: string | null
          stitching_addon_paisa?: number | null
          stitching_label?: string | null
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          product_id?: string
          quantity?: number
          stitcher_slug?: string | null
          stitching_addon_paisa?: number | null
          stitching_label?: string | null
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          archived_at: string | null
          created_at: string
          family: Database["public"]["Enums"]["color_family"]
          hex: string
          id: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          family: Database["public"]["Enums"]["color_family"]
          hex: string
          id?: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          family?: Database["public"]["Enums"]["color_family"]
          hex?: string
          id?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount_paisa: number
          created_at: string
          credited_at: string | null
          id: string
          order_id: string
          rate_type: Database["public"]["Enums"]["commission_type"]
          rate_value: number
          sale_paisa: number
          status: Database["public"]["Enums"]["commission_status"]
          vendor_id: string
        }
        Insert: {
          amount_paisa: number
          created_at?: string
          credited_at?: string | null
          id?: string
          order_id: string
          rate_type: Database["public"]["Enums"]["commission_type"]
          rate_value: number
          sale_paisa: number
          status?: Database["public"]["Enums"]["commission_status"]
          vendor_id: string
        }
        Update: {
          amount_paisa?: number
          created_at?: string
          credited_at?: string | null
          id?: string
          order_id?: string
          rate_type?: Database["public"]["Enums"]["commission_type"]
          rate_value?: number
          sale_paisa?: number
          status?: Database["public"]["Enums"]["commission_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      embroidery_techniques: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image_url: string | null
          order_id: string
          product_id: string | null
          quantity: number
          stitching_addon_paisa: number | null
          stitching_label: string | null
          title: string
          unit_price_paisa: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          image_url?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          stitching_addon_paisa?: number | null
          stitching_label?: string | null
          title: string
          unit_price_paisa: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          stitching_addon_paisa?: number | null
          stitching_label?: string | null
          title?: string
          unit_price_paisa?: number
          variant_id?: string | null
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
      order_status_events: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          contact_email: string
          fabric_total_paisa: number
          id: string
          order_number: string
          placed_at: string
          referral_code: string | null
          ship_city: string
          ship_first_name: string
          ship_last_name: string
          ship_postal: string
          ship_street: string
          shipping_paisa: number
          status: Database["public"]["Enums"]["order_status"]
          stitching_total_paisa: number
          total_paisa: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_email: string
          fabric_total_paisa: number
          id?: string
          order_number: string
          placed_at?: string
          referral_code?: string | null
          ship_city: string
          ship_first_name: string
          ship_last_name: string
          ship_postal: string
          ship_street: string
          shipping_paisa?: number
          status?: Database["public"]["Enums"]["order_status"]
          stitching_total_paisa?: number
          total_paisa: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string
          fabric_total_paisa?: number
          id?: string
          order_number?: string
          placed_at?: string
          referral_code?: string | null
          ship_city?: string
          ship_first_name?: string
          ship_last_name?: string
          ship_postal?: string
          ship_street?: string
          shipping_paisa?: number
          status?: Database["public"]["Enums"]["order_status"]
          stitching_total_paisa?: number
          total_paisa?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          amount_paisa: number
          id: string
          note: string | null
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          vendor_id: string
        }
        Insert: {
          amount_paisa: number
          id?: string
          note?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          vendor_id: string
        }
        Update: {
          amount_paisa?: number
          id?: string
          note?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          archived_at: string | null
          created_at: string
          default_meters: number | null
          default_size_scale_id: string | null
          default_stitching_addon_paisa: number | null
          gender: Database["public"]["Enums"]["product_gender"] | null
          has_dupatta: boolean
          id: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_meters?: number | null
          default_size_scale_id?: string | null
          default_stitching_addon_paisa?: number | null
          gender?: Database["public"]["Enums"]["product_gender"] | null
          has_dupatta?: boolean
          id?: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_meters?: number | null
          default_size_scale_id?: string | null
          default_stitching_addon_paisa?: number | null
          gender?: Database["public"]["Enums"]["product_gender"] | null
          has_dupatta?: boolean
          id?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_default_size_scale_id_fkey"
            columns: ["default_size_scale_id"]
            isOneToOne: false
            referencedRelation: "size_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      product_embroidery: {
        Row: {
          product_id: string
          technique_id: string
        }
        Insert: {
          product_id: string
          technique_id: string
        }
        Update: {
          product_id?: string
          technique_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_embroidery_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_embroidery_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "embroidery_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          blur_data_url: string | null
          bytes: number | null
          created_at: string
          height: number
          id: string
          mime_type: string
          position: number
          product_id: string
          storage_path: string
          width: number
        }
        Insert: {
          alt?: string | null
          blur_data_url?: string | null
          bytes?: number | null
          created_at?: string
          height: number
          id?: string
          mime_type: string
          position?: number
          product_id: string
          storage_path: string
          width: number
        }
        Update: {
          alt?: string | null
          blur_data_url?: string | null
          bytes?: number | null
          created_at?: string
          height?: number
          id?: string
          mime_type?: string
          position?: number
          product_id?: string
          storage_path?: string
          width?: number
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
          id: string
          product_id: string
          size: string
          sku: string | null
          stock: number
        }
        Insert: {
          id?: string
          product_id: string
          size: string
          sku?: string | null
          stock?: number
        }
        Update: {
          id?: string
          product_id?: string
          size?: string
          sku?: string | null
          stock?: number
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
          archived_at: string | null
          badge: string | null
          badge_id: string | null
          category: string | null
          category_id: string
          color: string | null
          color_id: string
          compare_at_paisa: number | null
          created_at: string
          created_by: string | null
          description: string
          dupatta_fabric_id: string | null
          dupatta_finish: string | null
          dupatta_info: string | null
          dupatta_length: number | null
          embroidery: string | null
          fabric: string | null
          fabric_id: string
          fabric_weight_gsm: number | null
          gender: Database["public"]["Enums"]["product_gender"]
          heritage_story: string | null
          id: string
          is_new_arrival: boolean
          meters: string | null
          meters_length: number | null
          meters_note: string | null
          price_paisa: number
          rating: number | null
          review_count: number
          size_scale_id: string | null
          sku: string | null
          slug: string
          stitching_addon_paisa: number | null
          stitching_eligible: boolean
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          badge?: string | null
          badge_id?: string | null
          category?: string | null
          category_id: string
          color?: string | null
          color_id: string
          compare_at_paisa?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          dupatta_fabric_id?: string | null
          dupatta_finish?: string | null
          dupatta_info?: string | null
          dupatta_length?: number | null
          embroidery?: string | null
          fabric?: string | null
          fabric_id: string
          fabric_weight_gsm?: number | null
          gender: Database["public"]["Enums"]["product_gender"]
          heritage_story?: string | null
          id?: string
          is_new_arrival?: boolean
          meters?: string | null
          meters_length?: number | null
          meters_note?: string | null
          price_paisa: number
          rating?: number | null
          review_count?: number
          size_scale_id?: string | null
          sku?: string | null
          slug: string
          stitching_addon_paisa?: number | null
          stitching_eligible?: boolean
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          badge?: string | null
          badge_id?: string | null
          category?: string | null
          category_id?: string
          color?: string | null
          color_id?: string
          compare_at_paisa?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          dupatta_fabric_id?: string | null
          dupatta_finish?: string | null
          dupatta_info?: string | null
          dupatta_length?: number | null
          embroidery?: string | null
          fabric?: string | null
          fabric_id?: string
          fabric_weight_gsm?: number | null
          gender?: Database["public"]["Enums"]["product_gender"]
          heritage_story?: string | null
          id?: string
          is_new_arrival?: boolean
          meters?: string | null
          meters_length?: number | null
          meters_note?: string | null
          price_paisa?: number
          rating?: number | null
          review_count?: number
          size_scale_id?: string | null
          sku?: string | null
          slug?: string
          stitching_addon_paisa?: number | null
          stitching_eligible?: boolean
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_dupatta_fabric_id_fkey"
            columns: ["dupatta_fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_size_scale_id_fkey"
            columns: ["size_scale_id"]
            isOneToOne: false
            referencedRelation: "size_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_hash: string | null
          product_id: string | null
          user_agent: string | null
          vendor_id: string
          visitor_token: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          product_id?: string | null
          user_agent?: string | null
          vendor_id: string
          visitor_token: string
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          product_id?: string | null
          user_agent?: string | null
          vendor_id?: string
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_clicks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          category: Database["public"]["Enums"]["access_category"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          category: Database["public"]["Enums"]["access_category"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          category?: Database["public"]["Enums"]["access_category"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      size_scales: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          label: string
          position: number
          size_values: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label: string
          position?: number
          size_values: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label?: string
          position?: number
          size_values?: string[]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      stitching_reference_images: {
        Row: {
          bytes: number | null
          height: number | null
          id: string
          mime_type: string
          stitching_request_id: string
          storage_path: string
          uploaded_at: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          height?: number | null
          id?: string
          mime_type: string
          stitching_request_id: string
          storage_path: string
          uploaded_at?: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          height?: number | null
          id?: string
          mime_type?: string
          stitching_request_id?: string
          storage_path?: string
          uploaded_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stitching_reference_images_stitching_request_id_fkey"
            columns: ["stitching_request_id"]
            isOneToOne: false
            referencedRelation: "stitching_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      stitching_requests: {
        Row: {
          assigned_tailor_id: string | null
          created_at: string
          garment_type: string
          hemline: string | null
          id: string
          measurements: Json
          neckline: string | null
          notes: string | null
          order_item_id: string | null
          sleeve: string | null
          status: Database["public"]["Enums"]["stitching_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_tailor_id?: string | null
          created_at?: string
          garment_type: string
          hemline?: string | null
          id?: string
          measurements?: Json
          neckline?: string | null
          notes?: string | null
          order_item_id?: string | null
          sleeve?: string | null
          status?: Database["public"]["Enums"]["stitching_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_tailor_id?: string | null
          created_at?: string
          garment_type?: string
          hemline?: string | null
          id?: string
          measurements?: Json
          neckline?: string | null
          notes?: string | null
          order_item_id?: string | null
          sleeve?: string | null
          status?: Database["public"]["Enums"]["stitching_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stitching_requests_assigned_tailor_id_fkey"
            columns: ["assigned_tailor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stitching_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stitching_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_path: string | null
          commission_type: Database["public"]["Enums"]["commission_type"] | null
          commission_value: number | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          is_anonymous: boolean
          name: string | null
          password_hash: string | null
          referral_code: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          name?: string | null
          password_hash?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          name?: string | null
          password_hash?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          added_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_due_commissions: { Args: never; Returns: number }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_anonymous_user: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      reserve_order_stock: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      access_category:
        | "PRODUCTS"
        | "ORDERS"
        | "STITCHING"
        | "VENDORS"
        | "REPORTS"
      app_role: "CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR" | "SUPER_ADMIN"
      color_family:
        | "BLACK"
        | "WHITE"
        | "CREAM"
        | "BEIGE"
        | "BROWN"
        | "GREY"
        | "RED"
        | "PINK"
        | "ORANGE"
        | "YELLOW"
        | "GREEN"
        | "BLUE"
        | "PURPLE"
        | "GOLD"
        | "SILVER"
        | "MULTI"
      commission_status: "PENDING" | "CREDITED" | "PAID" | "REVERSED"
      commission_type: "PERCENT" | "FLAT"
      order_status:
        | "CONFIRMED"
        | "PROCESSING"
        | "DELIVERED"
        | "CANCELLED"
        | "REFUNDED"
      payout_status: "REQUESTED" | "PROCESSING" | "PAID" | "REJECTED"
      product_gender: "Women" | "Men" | "Unisex"
      stitching_status:
        | "AWAITING_MEASUREMENTS"
        | "IN_PROGRESS"
        | "QUALITY_CHECK"
        | "READY_FOR_FITTING"
        | "DELIVERED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_category: [
        "PRODUCTS",
        "ORDERS",
        "STITCHING",
        "VENDORS",
        "REPORTS",
      ],
      app_role: ["CUSTOMER", "ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"],
      color_family: [
        "BLACK",
        "WHITE",
        "CREAM",
        "BEIGE",
        "BROWN",
        "GREY",
        "RED",
        "PINK",
        "ORANGE",
        "YELLOW",
        "GREEN",
        "BLUE",
        "PURPLE",
        "GOLD",
        "SILVER",
        "MULTI",
      ],
      commission_status: ["PENDING", "CREDITED", "PAID", "REVERSED"],
      commission_type: ["PERCENT", "FLAT"],
      order_status: [
        "CONFIRMED",
        "PROCESSING",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      payout_status: ["REQUESTED", "PROCESSING", "PAID", "REJECTED"],
      product_gender: ["Women", "Men", "Unisex"],
      stitching_status: [
        "AWAITING_MEASUREMENTS",
        "IN_PROGRESS",
        "QUALITY_CHECK",
        "READY_FOR_FITTING",
        "DELIVERED",
      ],
    },
  },
} as const
