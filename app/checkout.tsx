import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Edit3, MapPin, Phone, Save, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { useCart } from '../lib/context/CartContext';
import { useOrder } from '../lib/context/OrderContext';
import { useUser } from '../lib/context/UserContext';
import { LocationData } from '../lib/services/locationService';
import { CreateOrderData, OrderService } from '../lib/services/orderService';
import { UserProfileService } from '../lib/services/userProfileService';

export default function CheckoutScreen() {
  const router = useRouter();
  const { state, clearCart, syncCartWithServer } = useCart();
  const { state: userState, updateProfile } = useUser();
  const { uid } = useAuth();
  const { addOrder } = useOrder();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Edit modal state
  const [editDetailsModalVisible, setEditDetailsModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editZip, setEditZip] = useState('');

  // Load user data and delivery preference on component mount
  useEffect(() => {
    const loadCheckoutData = async () => {
      if (userState.profile) {
        setCustomerName(userState.profile.name || '');
        setCustomerEmail(userState.profile.email || '');
        setCustomerPhone(userState.profile.phone || '');
        
        try {
          // Check if user selected current location
          const useCurrentLocation = await AsyncStorage.getItem('useCurrentLocation');
          
          if (useCurrentLocation === 'true') {
            // Load current location data
            const currentLocationData = await AsyncStorage.getItem('currentLocationData');
            if (currentLocationData) {
              const location: LocationData = JSON.parse(currentLocationData);
              setDeliveryAddress(location.fullAddress || location.address || '');
              setCity(location.city || '');
              setZipCode(location.postalCode || '');
            }
          } else {
            // Load selected delivery address or default address
            const selectedAddressData = await AsyncStorage.getItem('selectedDeliveryAddress');
            if (selectedAddressData) {
              const selectedAddress = JSON.parse(selectedAddressData);
              setDeliveryAddress(selectedAddress.street);
              setCity(selectedAddress.city);
              setZipCode(selectedAddress.zip);
            } else {
              // Fallback to default address
              const defaultAddress = userState.profile.addresses.find(addr => addr.isDefault);
              if (defaultAddress) {
                setDeliveryAddress(defaultAddress.street);
                setCity(defaultAddress.city);
                setZipCode(defaultAddress.zip);
              }
            }
          }
        } catch (error) {
          console.error('Error loading delivery preference:', error);
          // Fallback to default address on error
          const defaultAddress = userState.profile.addresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setDeliveryAddress(defaultAddress.street);
            setCity(defaultAddress.city);
            setZipCode(defaultAddress.zip);
          }
        }
      }
    };

    loadCheckoutData();
  }, [userState.profile]);

  // Edit details functions
  const openEditDetails = () => {
    setEditName(customerName);
    setEditEmail(customerEmail);
    setEditPhone(customerPhone);
    setEditAddress(deliveryAddress);
    setEditCity(city);
    setEditZip(zipCode);
    setEditDetailsModalVisible(true);
  };

  const saveDetails = () => {
    if (editName.trim() && editEmail.trim() && editPhone.trim() && editAddress.trim() && editCity.trim() && editZip.trim()) {
      setCustomerName(editName.trim());
      setCustomerEmail(editEmail.trim());
      setCustomerPhone(editPhone.trim());
      setDeliveryAddress(editAddress.trim());
      setCity(editCity.trim());
      setZipCode(editZip.trim());
      
      // Update user profile
      updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      
      setEditDetailsModalVisible(false);
      Alert.alert('Success', 'Details updated successfully!');
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }

    setLoading(true);

    try {
      // If user is authenticated, save/update their profile and address in Supabase
      if (uid && userState.profile && userState.profile.id !== 'default-user') {
        // Update user profile
        await UserProfileService.updateProfile(uid, {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        });

        // Check if this address already exists
        const addresses = await UserProfileService.getAddresses(userState.profile.id);
        const existingAddress = addresses.find(
          addr => addr.street === deliveryAddress.trim() && 
                 addr.city === city.trim() && 
                 addr.zip_code === zipCode.trim()
        );

        if (!existingAddress) {
          // Add new address
          await UserProfileService.addAddress(userState.profile.id, {
            title: 'Delivery Address',
            street: deliveryAddress.trim(),
            city: city.trim(),
            zip_code: zipCode.trim(),
            is_default: addresses.length === 0, // Set as default if it's the first address
          });
          
          // Refresh user profile to get updated addresses
          const updatedProfile = await UserProfileService.getOrCreateProfile(uid, customerEmail.trim());
          if (updatedProfile) {
            const allAddresses = await UserProfileService.getAddresses(updatedProfile.id);
            // Update local state with refreshed addresses
            await updateProfile({
              addresses: allAddresses.map(addr => ({
                id: addr.id,
                title: addr.title,
                street: addr.street,
                city: addr.city,
                zip: addr.zip_code,
                isDefault: addr.is_default,
              })) as any,
            });
          }
        }
      }
      const orderData: CreateOrderData = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || 'no-email@example.com',
        customer_phone: customerPhone.trim(),
        user_id: uid || undefined,
        user_profile_id: userState.profile?.id !== 'default-user' ? userState.profile?.id : undefined,
        delivery_address: {
          street: deliveryAddress.trim(),
          city: city.trim(),
          zip: zipCode.trim(),
          coordinates: null, // Could add GPS coordinates here
        },
        order_notes: orderNotes.trim() || undefined,
        payment_method: paymentMethod,
        subtotal: state.subtotal,
        tax_amount: state.tax,
        delivery_fee: state.deliveryFee,
        total_amount: state.total,
        items: state.items.map(item => ({
          item_type: item.type,
          item_id: (item.type === 'menu_item' ? item.menuItem?.id : 
                   item.type === 'deal' ? item.deal?.id : 
                   item.id) || 'unknown',
          item_name: item.name,
          item_description: item.type === 'menu_item' && item.size ? 
            `${item.size.size_name} - ${item.description}` : 
            item.description || '',
          quantity: item.quantity,
          unit_price: item.type === 'menu_item' && item.size ? 
            item.size.price : 
            Math.round(item.totalPrice / item.quantity),
          total_price: item.totalPrice,
          customizations: item.type === 'custom_pizza' && item.pizzaCustomization ? {
            size: item.pizzaCustomization.size.name,
            crust: item.pizzaCustomization.crust.name,
            sauce: item.pizzaCustomization.sauce.name,
            toppings: item.pizzaCustomization.toppings.map(t => t.name),
          } : item.type === 'menu_item' && item.customizations ? {
            size: item.size?.size_name,
            toppings: item.customizations.toppings,
            notes: item.customizations.notes,
          } : item.type === 'deal' && item.deal ? {
            deal_items: item.deal.items_included,
          } : {},
        })),
      };

      const order = await OrderService.createOrder(orderData);

      if (order) {
        // Add order to OrderContext (cast to ExtendedOrder)
        addOrder(order as any);
        
        // Store the phone number for order tracking
        await AsyncStorage.setItem('lastOrderPhone', customerPhone.trim());
        
        // Clear cart locally and sync to server
        await clearCart();
        
        Alert.alert(
          'Order Placed Successfully!',
          `Your order #${order.order_number} has been placed.\n\nTotal: PKR ${order.total_amount}\n\nYou will receive updates via SMS.`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(tabs)/orders');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-[#D32F2F] pt-12 pb-4 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Checkout</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Order Summary */}
        <View className="bg-white rounded-xl p-4 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <Text className="text-xl font-bold mb-4">Order Summary</Text>
          {state.items.map((item) => (
            <View key={item.id} className="flex-row justify-between items-center mb-2">
              <View className="flex-1">
                <Text className="font-medium">{item.name}</Text>
                <Text className="text-gray-500 text-sm">
                  {item.type === 'menu_item' && item.size ? (
                    `${item.size.size_name} x ${item.quantity}`
                  ) : item.type === 'custom_pizza' && item.pizzaCustomization ? (
                    `${item.pizzaCustomization.size.name} Pizza x ${item.quantity}`
                  ) : (
                    `x ${item.quantity}`
                  )}
                </Text>
                {item.type === 'custom_pizza' && item.pizzaCustomization && (
                  <Text className="text-gray-500 text-xs">
                    {item.pizzaCustomization.crust.name} • {item.pizzaCustomization.sauce.name}
                    {item.pizzaCustomization.toppings.length > 0 && 
                      ` • ${item.pizzaCustomization.toppings.map(t => t.name).join(', ')}`
                    }
                  </Text>
                )}
                {item.customizations?.toppings && item.customizations.toppings.length > 0 && (
                  <Text className="text-gray-500 text-xs">
                    + {item.customizations.toppings.join(', ')}
                  </Text>
                )}
              </View>
              <Text className="font-bold">PKR {item.totalPrice}</Text>
            </View>
          ))}
          
          <View className="border-t border-gray-200 pt-3 mt-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="font-medium">PKR {state.subtotal}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Delivery Fee</Text>
              <Text className="font-medium">PKR {state.deliveryFee}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Tax (15%)</Text>
              <Text className="font-medium">PKR {state.tax}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold">Total</Text>
              <Text className="text-lg font-bold text-red-600">PKR {state.total}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View className="bg-white rounded-xl p-4 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Customer Information</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg"
              onPress={openEditDetails}
            >
              <Edit3 size={16} color="#D32F2F" />
              <Text className="text-red-600 font-medium ml-1">Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
              <User size={20} color="#757575" />
              <Text className="flex-1 ml-3 text-gray-800">
                {customerName || 'Enter your full name'}
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Phone Number *</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
              <Phone size={20} color="#757575" />
              <Text className="flex-1 ml-3 text-gray-800">
                {customerPhone || '+92 300 1234567'}
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Email (Optional)</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
              <User size={20} color="#757575" />
              <Text className="flex-1 ml-3 text-gray-800">
                {customerEmail || 'your.email@example.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white rounded-xl p-4 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Delivery Address</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg"
              onPress={openEditDetails}
            >
              <Edit3 size={16} color="#D32F2F" />
              <Text className="text-red-600 font-medium ml-1">Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Street Address *</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
              <MapPin size={20} color="#757575" />
              <Text className="flex-1 ml-3 text-gray-800">
                {deliveryAddress || 'House number, street name'}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-2">City *</Text>
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
                <MapPin size={20} color="#757575" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {city || 'Karachi, Lahore, Islamabad...'}
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-2">ZIP Code *</Text>
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
                <MapPin size={20} color="#757575" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {zipCode || '12345'}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Order Notes (Optional)</Text>
            <View className="bg-gray-100 rounded-lg px-3 py-3">
              <TextInput
                className="text-gray-800"
                placeholder="Special instructions for delivery..."
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View className="bg-white rounded-xl p-4 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <Text className="text-xl font-bold mb-4">Payment Method</Text>
          
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-lg border-2 mb-3 ${
              paymentMethod === 'cash' ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            onPress={() => setPaymentMethod('cash')}
          >
            <CreditCard size={24} color={paymentMethod === 'cash' ? '#D32F2F' : '#757575'} />
            <View className="ml-3">
              <Text className={`font-medium ${paymentMethod === 'cash' ? 'text-red-600' : 'text-gray-800'}`}>
                Cash on Delivery
              </Text>
              <Text className="text-gray-500 text-sm">Pay when your order arrives</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-lg border-2 ${
              paymentMethod === 'card' ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            onPress={() => setPaymentMethod('card')}
          >
            <CreditCard size={24} color={paymentMethod === 'card' ? '#D32F2F' : '#757575'} />
            <View className="ml-3">
              <Text className={`font-medium ${paymentMethod === 'card' ? 'text-red-600' : 'text-gray-800'}`}>
                Credit/Debit Card
              </Text>
              <Text className="text-gray-500 text-sm">Pay securely online</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          className={`bg-[#D32F2F] rounded-xl p-4 mb-8 ${loading ? 'opacity-50' : ''}`}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text className="text-white text-center text-lg font-bold">
            {loading ? 'Placing Order...' : `Place Order - PKR ${state.total}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Details Modal */}
      <Modal
        visible={editDetailsModalVisible}
        animationType="slide"
        onRequestClose={() => setEditDetailsModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setEditDetailsModalVisible(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Edit Details</Text>
            <TouchableOpacity onPress={saveDetails}>
              <Save size={24} color="#D32F2F" />
            </TouchableOpacity>
          </View>
          
          <ScrollView className="px-4 py-6">
            <Text className="text-lg font-bold text-gray-800 mb-4">Customer Information</Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Enter your full name"
                value={editName}
                onChangeText={setEditName}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email *</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Enter your email"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Phone Number *</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Enter your phone number"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text className="text-lg font-bold text-gray-800 mb-4">Delivery Address</Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Street Address *</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="House number, street name"
                value={editAddress}
                onChangeText={setEditAddress}
                multiline
              />
            </View>
            
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">City *</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="Karachi, Lahore, Islamabad..."
                  value={editCity}
                  onChangeText={setEditCity}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">ZIP Code *</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="12345"
                  value={editZip}
                  onChangeText={setEditZip}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
