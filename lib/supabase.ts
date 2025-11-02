import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration with environment support
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://svgpmbhocwhcnqmyuhzv.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Z3BtYmhvY3doY25xbXl1aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDAyMDUsImV4cCI6MjA2OTQ3NjIwNX0.bjIG4_5vqTtQbraCvdaqn3-jaT7iB6m-Q1G7jL71I6M';

// Get the redirect URL based on environment
export const getRedirectUrl = () => {
  if (__DEV__) {
    return 'http://localhost:8081'; // Development
  }
  return Constants.expoConfig?.extra?.productionRedirectUrl || 'https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8'; // Production
};

// Avoid accessing React Native AsyncStorage during Node/EAS export
const isNodeEnvironment = typeof window === 'undefined';

// Conditionally resolve AsyncStorage only in React Native runtime
let rnAsyncStorage: any = undefined;
if (!isNodeEnvironment) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	rnAsyncStorage = require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rnAsyncStorage,
    autoRefreshToken: !isNodeEnvironment,
    persistSession: !isNodeEnvironment,
    detectSessionInUrl: false,
  },
});

// Database types based on the schema
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
  rating: number;
  is_popular: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  category?: Category;
  sizes?: MenuItemSize[];
}

export interface MenuItemSize {
  id: string;
  menu_item_id: string;
  size_name: string;
  price: number;
  is_available: boolean;
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  price: number;
  items_included: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company?: string;
  delivery_address: any;
  order_notes?: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  estimated_delivery_time?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: any;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  created_at: string;
  created_by: string;
}
