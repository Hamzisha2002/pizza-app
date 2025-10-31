import { Order, OrderItem, OrderStatusHistory, supabase } from '../supabase';

export interface CreateOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  user_id?: string;
  user_profile_id?: string;
  company?: string;
  delivery_address: any;
  order_notes?: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  items: {
    item_type: string;
    item_id: string;
    item_name: string;
    item_description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    customizations?: any;
  }[];
}

export class OrderService {
  // Create a new order
  static async createOrder(orderData: CreateOrderData): Promise<Order | null> {
    try {
      // Generate order number
      const orderNumber = `BBP-${Date.now()}`;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          user_id: orderData.user_id,
          user_profile_id: orderData.user_profile_id,
          company: orderData.company,
          delivery_address: orderData.delivery_address,
          order_notes: orderData.order_notes,
          payment_method: orderData.payment_method,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount,
          delivery_fee: orderData.delivery_fee,
          total_amount: orderData.total_amount,
          order_status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        item_type: item.item_type,
        item_id: item.item_id,
        item_name: item.item_name,
        item_description: item.item_description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        customizations: item.customizations,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create initial status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Order placed successfully',
          created_by: 'system',
        });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  // Get order by ID
  static async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Get order by order number
  static async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Get order items
  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
  }

  // Get order status history
  static async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order status history:', error);
      return [];
    }
  }

  // Update order status
  static async updateOrderStatus(
    orderId: string, 
    status: string, 
    notes?: string
  ): Promise<boolean> {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          order_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: status,
          notes: notes || `Status updated to ${status}`,
          created_by: 'system',
        });

      if (historyError) throw historyError;

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Get orders by customer phone
  static async getOrdersByCustomer(customerPhone: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  }

  // Get orders by user ID with related data
  static async getOrdersByUserId(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_status_history (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  // Get active orders (not delivered/cancelled) for user
  static async getActiveOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .not('order_status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: false});

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active orders:', error);
      return [];
    }
  }

  // Get order history (delivered/cancelled) for user
  static async getOrderHistoryByUserId(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .in('order_status', ['delivered', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order history:', error);
      return [];
    }
  }
}
