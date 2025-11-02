import { CartItem } from '../context/CartContext';
import { supabase } from '../supabase';

export interface CartSession {
  id: string;
  user_id: string;
  cart_items: CartItem[];
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export class CartSyncService {
  /**
   * Get user's cart from Supabase
   */
  static async getCart(userId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_cart_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return [];
      }

      return data.cart_items || [];
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [];
    }
  }

  /**
   * Sync cart to Supabase
   */
  static async syncCart(
    userId: string,
    cartItems: CartItem[],
    totalAmount: number
  ): Promise<{ error: any | null }> {
    try {
      // Check if cart session exists
      const { data: existingCart } = await supabase
        .from('user_cart_sessions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingCart) {
        // Update existing cart
        const { error } = await supabase
          .from('user_cart_sessions')
          .update({
            cart_items: cartItems,
            total_amount: totalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        return { error };
      } else {
        // Create new cart session
        const { error } = await supabase
          .from('user_cart_sessions')
          .insert({
            user_id: userId,
            cart_items: cartItems,
            total_amount: totalAmount,
          });

        return { error };
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
      return { error };
    }
  }

  /**
   * Clear cart from Supabase
   */
  static async clearCart(userId: string): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase
        .from('user_cart_sessions')
        .update({
          cart_items: [],
          total_amount: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Delete cart session
   */
  static async deleteCart(userId: string): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase
        .from('user_cart_sessions')
        .delete()
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Merge local cart with server cart (useful when user logs in)
   */
  static async mergeAndSyncCart(
    userId: string,
    localCart: CartItem[],
    localTotal: number
  ): Promise<{ cart: CartItem[]; error: any | null }> {
    try {
      // Get server cart
      const serverCart = await this.getCart(userId);

      // Merge carts (prefer local cart items, but keep server items not in local)
      const mergedCart: CartItem[] = [...localCart];
      const localIds = new Set(localCart.map(item => item.id));

      // Add server items that aren't in local cart
      serverCart.forEach(serverItem => {
        if (!localIds.has(serverItem.id)) {
          mergedCart.push(serverItem);
        }
      });

      // Calculate new total
      const newTotal = mergedCart.reduce((sum, item) => sum + item.totalPrice, 0);

      // Sync merged cart to server
      await this.syncCart(userId, mergedCart, newTotal);

      return { cart: mergedCart, error: null };
    } catch (error) {
      console.error('Error merging cart:', error);
      return { cart: localCart, error };
    }
  }
}

