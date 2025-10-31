import { CheckCircle, Clock, MapPin, Phone, RefreshCw, Truck, User, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/context/AuthContext';
import { useOrder } from '../../lib/context/OrderContext';
import { Order, OrderItem, OrderStatusHistory } from '../../lib/supabase';

// Extended order type with related data
interface ExtendedOrder extends Order {
  order_items?: OrderItem[];
  order_status_history?: OrderStatusHistory[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock push notification settings
const notificationSettings = [
  { id: 'order_updates', title: 'Order Updates', enabled: true },
  { id: 'delivery', title: 'Delivery Status', enabled: true },
  { id: 'promotions', title: 'Promotions', enabled: false },
  { id: 'feedback', title: 'Feedback Requests', enabled: true },
];

export default function OrderTrackingScreen() {
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [notifications, setNotifications] = useState(notificationSettings);
  const [countdown, setCountdown] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use OrderContext instead of local state
  const { state: orderState, refreshOrders } = useOrder();
  const { isAuthenticated, uid } = useAuth();
  
  const orders = orderState.orders as ExtendedOrder[];
  const loading = orderState.loading;

  // Pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    if (!isAuthenticated || !uid) {
      return;
    }

    setRefreshing(true);
    try {
      console.log('🔄 Orders: Pull-to-refresh - refreshing orders from database...');
      await refreshOrders();
      console.log('✅ Orders: Pull-to-refresh completed successfully');
    } catch (error) {
      console.error('❌ Orders: Pull-to-refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, uid, refreshOrders]);

  // Refresh orders when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && uid) {
      console.log('🔄 Refreshing orders from database...');
      refreshOrders();
    }
  }, [isAuthenticated, uid]);

  // Set the first order as selected by default when orders load
  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrder]);

  // Add focus listener to refresh orders when user navigates to this tab
  useEffect(() => {
    const unsubscribe = () => {
      // This will be called when the screen comes into focus
      if (isAuthenticated && uid) {
        refreshOrders();
      }
    };

    // For now, we'll just fetch on mount
    // In a real app, you'd use navigation focus listeners
    return unsubscribe;
  }, [isAuthenticated, uid]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const toggleNotification = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, enabled: !notification.enabled } 
        : notification
    ));
  };

  const getStatusIcon = (statusId: string, completed: boolean) => {
    const color = completed ? "#D32F2F" : "#9E9E9E";
    const size = 24;
    
    switch (statusId) {
      case "pending":
        return <Clock color={color} size={size} />;
      case "confirmed":
        return <CheckCircle color={color} size={size} fill={completed ? "#D32F2F" : "none"} />;
      case "preparing":
        return <Clock color={color} size={size} />;
      case "ready":
        return <CheckCircle color={color} size={size} fill={completed ? "#D32F2F" : "none"} />;
      case "out_for_delivery":
        return <Truck color={color} size={size} />;
      case "delivered":
        return <CheckCircle color={color} size={size} fill={completed ? "#D32F2F" : "none"} />;
      case "cancelled":
        return <X color={color} size={size} />;
      default:
        return <CheckCircle color={color} size={size} />;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "pending":
        return "Order Placed";
      case "confirmed":
        return "Confirmed";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready for Pickup";
      case "out_for_delivery":
        return "On the Way";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "confirmed":
        return "#2196F3";
      case "preparing":
        return "#FF5722";
      case "ready":
        return "#4CAF50";
      case "out_for_delivery":
        return "#9C27B0";
      case "delivered":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#D32F2F] pt-12 pb-6 px-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Order Tracking</Text>
          <View className="flex-row items-center space-x-3">
            {isAuthenticated && (
              <TouchableOpacity 
                className="p-2 bg-white/20 rounded-full"
                onPress={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw 
                  size={20} 
                  color="white" 
                  style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity>
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Orders Info Bar */}
      {isAuthenticated && (
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 text-sm">
              {orders.length > 0 ? `${orders.length} order${orders.length === 1 ? '' : 's'} found` : 'No orders yet'}
            </Text>
            {refreshing && (
              <Text className="text-gray-500 text-xs">Refreshing...</Text>
            )}
          </View>
        </View>
      )}

      <ScrollView 
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D32F2F']} // Android
            tintColor="#D32F2F" // iOS
            title="Pull to refresh orders"
            titleColor="#666"
          />
        }
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-lg">Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-lg mb-2">No orders found</Text>
            <Text className="text-gray-400 text-center">
              Your order history will appear here once you place an order.
            </Text>
          </View>
        ) : (
          <>
            {/* Order Selection */}
            {orders.length > 1 && (
              <View className="mb-4">
                <Text className="text-lg font-bold mb-2">Select Order:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {orders.map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      className={`mr-3 px-4 py-2 rounded-full ${
                        selectedOrder?.id === order.id ? 'bg-red-500' : 'bg-gray-200'
                      }`}
                      onPress={() => setSelectedOrder(order)}
                    >
                      <Text className={`font-medium ${
                        selectedOrder?.id === order.id ? 'text-white' : 'text-gray-700'
                      }`}>
                        {order.order_number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedOrder && (
              <>
                {/* Order Info */}
                <View className="bg-[#F5F5F5] rounded-xl p-4 mb-6">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-[#212121]">{selectedOrder.order_number}</Text>
                    <Text 
                      className="font-bold"
                      style={{ color: getStatusColor(selectedOrder.order_status) }}
                    >
                      {getStatusDisplayName(selectedOrder.order_status)}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <Clock color="#757575" size={16} />
                    <Text className="ml-2 text-[#757575]">
                      Order placed: {new Date(selectedOrder.created_at).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <MapPin color="#757575" size={16} />
                    <Text className="ml-2 text-[#757575]">
                      {selectedOrder.delivery_address?.street}, {selectedOrder.delivery_address?.city}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-[#757575]">Total: </Text>
                    <Text className="font-bold text-[#D32F2F]">PKR {selectedOrder.total_amount}</Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* Countdown Timer - Only show for out_for_delivery status */}
        {selectedOrder && selectedOrder.order_status === 'out_for_delivery' && (
          <View className="bg-[#FF5722] rounded-xl p-4 mb-6">
            <Text className="text-white text-center text-lg font-bold">
              Delivery in approximately {countdown} minutes
            </Text>
            <Text className="text-white text-center text-opacity-90 mt-1">
              Your order is on the way
            </Text>
          </View>
        )}

        {/* Map Placeholder - Only show for out_for_delivery status */}
        {selectedOrder && selectedOrder.order_status === 'out_for_delivery' && (
          <View className="bg-gray-200 rounded-xl mb-6 overflow-hidden">
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1522752562114-9deaf20c2058?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFVyYmFuJTIwY2l0eSUyMHNreWxpbmV8ZW58MHx8MHx8fDA%3D" }} 
              style={{ width: SCREEN_WIDTH - 32, height: 200 }}
              resizeMode="cover"
            />
            <View className="absolute bottom-4 left-4 bg-white p-3 rounded-lg flex-row items-center">
              <Truck color="#D32F2F" size={24} />
              <Text className="ml-2 font-bold">Driver on the way</Text>
            </View>
          </View>
        )}

        {/* Status Timeline */}
        {selectedOrder && (
          <View className="mb-8">
            <Text className="text-xl font-bold text-[#212121] mb-4">Order Status</Text>
            
            <View className="relative pl-8 border-l-2 border-[#D32F2F]">
              {selectedOrder.order_status_history && selectedOrder.order_status_history.length > 0 ? (
                selectedOrder.order_status_history.map((statusItem: OrderStatusHistory, index: number) => (
                  <View key={statusItem.id} className="relative mb-6">
                    <View className={`absolute -left-10 w-8 h-8 rounded-full items-center justify-center ${
                      index === selectedOrder.order_status_history!.length - 1
                        ? "bg-[#D32F2F]" 
                        : "bg-white border-2 border-[#D32F2F]"
                    }`}>
                      {getStatusIcon(statusItem.status, index === selectedOrder.order_status_history!.length - 1)}
                    </View>
                    
                    <View className={`${index === selectedOrder.order_status_history!.length - 1 ? "" : "opacity-60"}`}>
                      <Text className="font-bold text-[#212121]">{getStatusDisplayName(statusItem.status)}</Text>
                      <Text className="text-[#757575]">
                        {new Date(statusItem.created_at).toLocaleString()}
                      </Text>
                      {statusItem.notes && (
                        <Text className="text-[#757575] text-sm mt-1">{statusItem.notes}</Text>
                      )}
                    </View>
                    
                    {index === selectedOrder.order_status_history!.length - 1 && (
                      <View className="mt-2">
                        <Text className="text-[#D32F2F] font-medium">Current status</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View className="relative mb-6">
                  <View className="absolute -left-10 w-8 h-8 rounded-full items-center justify-center bg-[#D32F2F]">
                    {getStatusIcon(selectedOrder.order_status, true)}
                  </View>
                  <View>
                    <Text className="font-bold text-[#212121]">{getStatusDisplayName(selectedOrder.order_status)}</Text>
                    <Text className="text-[#757575]">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <View className="mt-2">
                    <Text className="text-[#D32F2F] font-medium">Current status</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Delivery Partner */}
        {selectedOrder && selectedOrder.order_status === 'out_for_delivery' && (
          <View className="bg-[#F5F5F5] rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold text-[#212121] mb-3">Delivery Partner</Text>
            
            <View className="flex-row items-center mb-3">
              <View className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              <View className="ml-4">
                <Text className="font-bold text-[#212121]">Driver Assigned</Text>
                <Text className="text-[#757575]">Your order is on the way</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-[#FFC107] font-bold">★ 4.8</Text>
                </View>
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-row items-center bg-white rounded-lg px-4 py-2">
                <Phone color="#D32F2F" size={16} />
                <Text className="ml-2 text-[#D32F2F] font-medium">Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row items-center bg-white rounded-lg px-4 py-2">
                <User color="#D32F2F" size={16} />
                <Text className="ml-2 text-[#D32F2F] font-medium">Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        {selectedOrder && selectedOrder.order_items && (
          <View className="mb-8">
            <Text className="text-xl font-bold text-[#212121] mb-4">Order Items</Text>
            
            <View className="bg-[#F5F5F5] rounded-xl p-4">
              {selectedOrder.order_items.map((item) => (
                <View key={item.id} className="flex-row justify-between py-2">
                  <View className="flex-1">
                    <Text className="text-[#212121] font-medium">
                      {item.quantity}x {item.item_name}
                    </Text>
                    {item.item_description && (
                      <Text className="text-[#757575] text-sm">{item.item_description}</Text>
                    )}
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <Text className="text-[#757575] text-xs mt-1">
                        {Object.entries(item.customizations).map(([key, value]) => 
                          `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                        ).join(' • ')}
                      </Text>
                    )}
                  </View>
                  <Text className="text-[#212121] font-medium">PKR {item.total_price}</Text>
                </View>
              ))}
              
              <View className="border-t border-gray-300 mt-2 pt-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-[#757575]">Subtotal</Text>
                  <Text className="text-[#757575]">PKR {selectedOrder.subtotal}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-[#757575]">Delivery Fee</Text>
                  <Text className="text-[#757575]">PKR {selectedOrder.delivery_fee}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-[#757575]">Tax</Text>
                  <Text className="text-[#757575]">PKR {selectedOrder.tax_amount}</Text>
                </View>
                <View className="border-t border-gray-300 mt-2 pt-2">
                  <View className="flex-row justify-between">
                    <Text className="font-bold text-[#212121]">Total</Text>
                    <Text className="font-bold text-[#D32F2F]">PKR {selectedOrder.total_amount}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Push Notification Settings */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-[#212121] mb-4">Notification Settings</Text>
          
          <View className="bg-[#F5F5F5] rounded-xl p-4">
            {notifications.map((notification) => (
              <View 
                key={notification.id} 
                className="flex-row items-center justify-between py-3 border-b border-gray-300 last:border-0"
              >
                <Text className="text-[#212121]">{notification.title}</Text>
                <TouchableOpacity 
                  className={`w-12 h-6 rounded-full p-1 ${
                    notification.enabled ? "bg-[#D32F2F]" : "bg-gray-300"
                  }`}
                  onPress={() => toggleNotification(notification.id)}
                >
                  <View 
                    className={`bg-white w-4 h-4 rounded-full ${
                      notification.enabled ? "ml-6" : "ml-0"
                    }`}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}