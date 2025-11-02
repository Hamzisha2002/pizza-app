import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { OrderService } from '../services/orderService';
import { Order, OrderItem, OrderStatusHistory, supabase } from '../supabase';

// Extended order interface with related data
interface ExtendedOrder extends Order {
  order_items?: OrderItem[];
  order_status_history?: OrderStatusHistory[];
}

// Order state interface
interface OrderState {
  orders: ExtendedOrder[];
  activeOrders: ExtendedOrder[];
  orderHistory: ExtendedOrder[];
  loading: boolean;
  error: string | null;
}

// Order context type
interface OrderContextType {
  state: OrderState;
  loadOrdersByUserId: (userId: string) => Promise<void>;
  loadOrdersByPhone: (phone: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  clearOrders: () => void;
  addOrder: (order: ExtendedOrder) => void;
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<boolean>;
}

// Initial state
const initialState: OrderState = {
  orders: [],
  activeOrders: [],
  orderHistory: [],
  loading: false,
  error: null,
};

// Action types
type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ORDERS'; payload: ExtendedOrder[] }
  | { type: 'ADD_ORDER'; payload: ExtendedOrder }
  | { type: 'UPDATE_ORDER'; payload: ExtendedOrder }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ORDERS' };

// Reducer
const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ORDERS':
      const orders = action.payload;
      const activeOrders = orders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.order_status)
      );
      const orderHistory = orders.filter(order => 
        ['delivered', 'cancelled'].includes(order.order_status)
      );
      
      return {
        ...state,
        orders,
        activeOrders,
        orderHistory,
        loading: false,
        error: null,
      };
    
    case 'ADD_ORDER':
      const newOrders = [action.payload, ...state.orders];
      const newActiveOrders = newOrders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.order_status)
      );
      const newOrderHistory = newOrders.filter(order => 
        ['delivered', 'cancelled'].includes(order.order_status)
      );
      
      return {
        ...state,
        orders: newOrders,
        activeOrders: newActiveOrders,
        orderHistory: newOrderHistory,
      };
    
    case 'UPDATE_ORDER':
      const updatedOrders = state.orders.map(order =>
        order.id === action.payload.id ? action.payload : order
      );
      const updatedActiveOrders = updatedOrders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.order_status)
      );
      const updatedOrderHistory = updatedOrders.filter(order => 
        ['delivered', 'cancelled'].includes(order.order_status)
      );
      
      return {
        ...state,
        orders: updatedOrders,
        activeOrders: updatedActiveOrders,
        orderHistory: updatedOrderHistory,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ORDERS':
      return {
        ...state,
        orders: [],
        activeOrders: [],
        orderHistory: [],
        error: null,
      };
    
    default:
      return state;
  }
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // Load orders by user ID from Supabase
  const loadOrdersByUserId = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try to get orders by user_id first
      let orders = await OrderService.getOrdersByUserId(userId) as ExtendedOrder[];
      
      // If no orders found by user_id, try to get by user_profile_id
      if (orders.length === 0) {
        // Get user profile to find user_profile_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (profile) {
          orders = await OrderService.getOrdersByUserId(userId) as ExtendedOrder[];
        }
      }
      
      dispatch({ type: 'SET_ORDERS', payload: orders });
      
      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem('userOrders', JSON.stringify(orders));
      
    } catch (error) {
      console.error('Error loading orders by user ID:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load orders' });
      
      // Fallback to local storage
      try {
        const savedOrders = await AsyncStorage.getItem('userOrders');
        if (savedOrders) {
          const orders: ExtendedOrder[] = JSON.parse(savedOrders);
          dispatch({ type: 'SET_ORDERS', payload: orders });
        }
      } catch (storageError) {
        console.error('Error loading orders from storage:', storageError);
      }
    }
  };

  // Load orders by phone number (fallback method)
  const loadOrdersByPhone = async (phone: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const orders = await OrderService.getOrdersByCustomer(phone) as ExtendedOrder[];
      dispatch({ type: 'SET_ORDERS', payload: orders });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userOrders', JSON.stringify(orders));
      
    } catch (error) {
      console.error('Error loading orders by phone:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load orders' });
    }
  };

  // Refresh orders (reload from server)
  const refreshOrders = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try to get current user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      const userPhone = await AsyncStorage.getItem('userPhone');
      
      if (userId) {
        await loadOrdersByUserId(userId);
      } else if (userPhone) {
        await loadOrdersByPhone(userPhone);
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'No user information available' });
      }
      
    } catch (error) {
      console.error('Error refreshing orders:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh orders' });
    }
  };

  // Clear all orders
  const clearOrders = () => {
    dispatch({ type: 'CLEAR_ORDERS' });
    AsyncStorage.removeItem('userOrders');
  };

  // Add a new order (when order is placed)
  const addOrder = (order: ExtendedOrder) => {
    dispatch({ type: 'ADD_ORDER', payload: order });
    
    // Update AsyncStorage
    AsyncStorage.getItem('userOrders').then(savedOrders => {
      const orders = savedOrders ? JSON.parse(savedOrders) : [];
      orders.unshift(order); // Add to beginning
      AsyncStorage.setItem('userOrders', JSON.stringify(orders));
    });
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const success = await OrderService.updateOrderStatus(orderId, status, notes);
      
      if (success) {
        // Refresh orders to get updated data
        await refreshOrders();
      }
      
      return success;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  // Load orders on app start - prioritize database over AsyncStorage
  useEffect(() => {
    const loadOrdersOnStart = async () => {
      try {
        // Check if user is authenticated first
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.id) {
          console.log('📋 Loading orders from database for authenticated user...');
          
          try {
            // Fetch orders from database
            await loadOrdersByUserId(user.id);
            console.log('✅ Orders loaded from database');
            return;
          } catch (error) {
            console.error('Error loading orders from database:', error);
          }
        }
        
        // Fallback: Load from AsyncStorage (for offline mode)
        console.log('📱 Loading orders from local storage (offline mode)...');
        const savedOrders = await AsyncStorage.getItem('userOrders');
        if (savedOrders) {
          const orders: ExtendedOrder[] = JSON.parse(savedOrders);
          dispatch({ type: 'SET_ORDERS', payload: orders });
          console.log('✅ Orders loaded from local storage');
        }
        
      } catch (error) {
        console.error('Error loading orders on start:', error);
      }
    };

    loadOrdersOnStart();
  }, []);

  return (
    <OrderContext.Provider
      value={{
        state,
        loadOrdersByUserId,
        loadOrdersByPhone,
        refreshOrders,
        clearOrders,
        addOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
