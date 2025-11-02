import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Minus, Pizza, Plus, Search, Star, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OptimizedImage from '../../components/OptimizedImage';
import { useAuth } from '../../lib/context/AuthContext';
import { CartItem, useCart } from '../../lib/context/CartContext';
import { UserAddress, useUser } from '../../lib/context/UserContext';
import LocationService, { LocationData } from '../../lib/services/locationService';
import { MenuService } from '../../lib/services/menuService';
import { Category, MenuItem } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { addItem, state: cartState } = useCart();
  const { state: userState, setDefaultAddress } = useUser();
  const { isAuthenticated, user, uid, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPizzas, setFeaturedPizzas] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizationModalVisible, setCustomizationModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Address change modal state
  const [addressChangeModalVisible, setAddressChangeModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false); // Track if user selected current location
  

  
  // Device location state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [locationFetched, setLocationFetched] = useState(false); // Track if location was fetched

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Calculate total items in cart
  const totalCartItems = cartState.items.reduce((total, item) => total + item.quantity, 0);

  // Load saved delivery preference on app start
  useEffect(() => {
    const loadDeliveryPreference = async () => {
      try {
        const savedUseCurrentLocation = await AsyncStorage.getItem('useCurrentLocation');
        if (savedUseCurrentLocation !== null) {
          setUseCurrentLocation(savedUseCurrentLocation === 'true');
        }
      } catch (error) {
        console.error('Error loading delivery preference:', error);
      }
    };

    loadDeliveryPreference();
  }, []);

  // Check location permission on app start
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // If permission was granted before, try to get current location automatically
        const permissionGranted = await AsyncStorage.getItem('location_permission_granted');
        if (permissionGranted === 'true') {
          await getCurrentDeviceLocation();
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    };

    checkLocationPermission();
  }, []);

  // Refresh function - pulls fresh data from all sources
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Clear cache for fresh data
      MenuService.clearCache();
      
      // Refresh menu data
      const [categoriesData, popularItems] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getPopularItems(),
      ]);
      
      setCategories(categoriesData);
      setFeaturedPizzas(popularItems);
      
      // Refresh location if available (force fresh location)
      if (currentLocation) {
        // Clear location cache and get fresh location
        await LocationService.clearLocationCache();
        await getCurrentDeviceLocation();
      }
      
      // Clear any search state
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Refresh Failed', 'Unable to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, popularItems] = await Promise.all([
          MenuService.getCategories(),
          MenuService.getPopularItems(),
        ]);
        
        setCategories(categoriesData);
        setFeaturedPizzas(popularItems);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get current device location (only fetches once on app launch)
  const getCurrentDeviceLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError('');
      
      const locationData = await LocationService.getCurrentLocation();
      if (locationData) {
        setCurrentLocation(locationData);
        setLocationFetched(true); // Mark location as successfully fetched
        console.log('Location updated:', LocationService.formatLocationForDisplay(locationData));
      } else {
        setLocationError('Unable to get location');
        setLocationFetched(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Location access failed');
      setLocationFetched(false);
    } finally {
      setLocationLoading(false);
    }
  };



  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      try {
        const results = await MenuService.searchMenuItems(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching menu items:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Address change functions
  const openAddressChange = () => {
    setAddressChangeModalVisible(true);
  };

  const handleAddressSelect = async (address: UserAddress) => {
    setSelectedAddress(address);
    setDefaultAddress(address.id);
    setUseCurrentLocation(false);
    setAddressChangeModalVisible(false);
    
    // Save preference to AsyncStorage
    try {
      await AsyncStorage.setItem('useCurrentLocation', 'false');
      await AsyncStorage.setItem('selectedDeliveryAddress', JSON.stringify(address));
    } catch (error) {
      console.error('Error saving address preference:', error);
    }
    
    Alert.alert('Success', `Delivery address changed to ${address.title}`);
  };

  const handleCurrentLocationSelect = async () => {
    // Only allow selection if location has been successfully fetched
    if (!locationFetched || !currentLocation) {
      Alert.alert(
        'Location Not Available',
        'Please wait for your location to be fetched, or enable location services.',
        [
          { text: 'OK' },
          {
            text: 'Enable Location',
            onPress: () => {
              setAddressChangeModalVisible(false);
              requestLocationManually();
            }
          }
        ]
      );
      return;
    }

    setUseCurrentLocation(true);
    setAddressChangeModalVisible(false);
    
    // Save preference to AsyncStorage
    try {
      await AsyncStorage.setItem('useCurrentLocation', 'true');
      await AsyncStorage.setItem('currentLocationData', JSON.stringify(currentLocation));
    } catch (error) {
      console.error('Error saving location preference:', error);
    }
    
    Alert.alert('Success', 'Delivery set to current location');
  };

  const getCurrentAddress = () => {
    // Respect user's delivery preference
    if (useCurrentLocation && currentLocation) {
      return LocationService.formatLocationForDisplay(currentLocation);
    }
    
    // If user selected a saved address or default
    if (selectedAddress) {
      return `${selectedAddress.street}, ${selectedAddress.city}`;
    }
    
    // Fallback to user's default address
    const defaultAddress = userState.profile?.addresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      return `${defaultAddress.street}, ${defaultAddress.city}`;
    }
    
    // Final fallback if no addresses exist
    if (currentLocation) {
      return LocationService.formatLocationForDisplay(currentLocation);
    }
    
    return 'Set your delivery location';
  };

  // Manual location permission request
  const requestLocationManually = async () => {
    try {
      setLocationLoading(true);
      setLocationError('');
      
      const permissionStatus = await LocationService.requestLocationPermission();
      
      if (permissionStatus.granted) {
        await AsyncStorage.setItem('location_permission_granted', 'true');
        await AsyncStorage.setItem('location_permission_asked', 'true');
        Alert.alert('Success', 'Location permission granted! Getting your location...');
        await getCurrentDeviceLocation();
      } else {
        await AsyncStorage.setItem('location_permission_granted', 'false');
        await AsyncStorage.setItem('location_permission_asked', 'true');
        if (permissionStatus.canAskAgain) {
          Alert.alert(
            'Permission Denied', 
            'Location permission was denied. You can enable it in your device settings.',
            [
              { text: 'OK' },
              { text: 'Open Settings', onPress: () => {
                // This would open device settings if available
                Alert.alert('Info', 'Please go to Settings > Privacy > Location Services to enable location for Big Boss Pizza');
              }}
            ]
          );
        } else {
          Alert.alert(
            'Permission Blocked', 
            'Location permission is permanently denied. Please enable it in your device settings: Settings > Privacy > Location Services > Big Boss Pizza'
          );
        }
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Failed to request location permission');
    } finally {
      setLocationLoading(false);
    }
  };


  // Open location in Google Maps
  const openLocationInMaps = async () => {
    if (!currentLocation) {
      Alert.alert('No Location', 'Please get your current location first');
      return;
    }

    try {
      const { latitude, longitude } = currentLocation;
      const address = LocationService.formatLocationForDisplay(currentLocation);
      
      // Try Google Maps app first (Android/iOS)
      const googleMapsAppUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(address)})&z=18`;
      
      // Apple Maps URL (iOS)
      const appleMapsUrl = `maps://?q=${encodeURIComponent(address)}&ll=${latitude},${longitude}&z=18`;
      
      // Fallback to web Google Maps
      const webGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      
      // Check which maps apps are available
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsAppUrl);
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
      
      // Try to open in preferred order
      if (canOpenGoogleMaps) {
        // Google Maps app
        await Linking.openURL(googleMapsAppUrl);
      } else if (canOpenAppleMaps) {
        // Apple Maps (iOS fallback)
        await Linking.openURL(appleMapsUrl);
      } else {
        // Web Google Maps as final fallback
        await Linking.openURL(webGoogleMapsUrl);
      }
      
    } catch (error) {
      console.error('Error opening maps:', error);
      // Even if native apps fail, try web Google Maps
      try {
        const { latitude, longitude } = currentLocation;
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        await Linking.openURL(webUrl);
      } catch (webError) {
        Alert.alert('Error', 'Failed to open Maps. Please check if you have Google Maps installed.');
      }
    }
  };

  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomizationModalVisible(true);
    setQuantity(1);
    setSelectedSize(item.sizes?.[0]?.id || '');
  };

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    const size = selectedItem.sizes?.find(s => s.id === selectedSize);
    return size ? size.price * quantity : 0;
  };

  const addToCart = () => {
    if (!selectedItem) return;
    
    const size = selectedItem.sizes?.find(s => s.id === selectedSize);
    if (!size) return;

    const cartItem: CartItem = {
      id: `${selectedItem.id}-${selectedSize}`,
      type: 'menu_item',
      menuItem: selectedItem,
      size: size,
      quantity: quantity,
      customizations: {
        toppings: [],
        notes: ''
      },
      totalPrice: calculateTotalPrice(),
      name: selectedItem.name,
      description: selectedItem.description,
      image: selectedItem.image_url,
    };

    addItem(cartItem);
    Alert.alert('Success', `${selectedItem.name} added to cart!`);
    setCustomizationModalVisible(false);
  };


  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#D32F2F] pt-12 pb-4 px-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
        <Image
              source={require('../../assets/images/BBP.jpg')}
              style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25,
                marginRight: 12 
              }}
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Big Boss Pizza</Text>
              <Text className="text-white text-opacity-90">
                {isAuthenticated && uid ? `User: ${uid.substring(0, 8)}...` : 'Delivered to your door'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            {isAuthenticated ? (
              <TouchableOpacity 
                onPress={signOut}
                className="bg-white bg-opacity-20 p-3 rounded-full mr-3 min-w-[44px] min-h-[44px] items-center justify-center"
              >
                <Text className="text-white text-lg font-bold">↩</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => router.push('/auth')}
                className="bg-white bg-opacity-20 p-3 rounded-full mr-3 min-w-[44px] min-h-[44px] items-center justify-center"
              >
                <Text className="text-white text-lg font-bold">👤</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/cart')}
              className="bg-white bg-opacity-20 p-3 rounded-full relative min-w-[44px] min-h-[44px] items-center justify-center"
            >
              <Text className="text-white text-xl font-bold">🛒</Text>
              {totalCartItems > 0 && (
                <View className="absolute -top-1 -right-1 bg-yellow-400 rounded-full min-w-[20px] h-5 items-center justify-center">
                  <Text className="text-red-800 text-xs font-bold">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D32F2F']} // Android
            tintColor="#D32F2F" // iOS
            title="Pull to refresh..." // iOS
            titleColor="#666666" // iOS
          />
        }
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-lg">
              {refreshing ? 'Refreshing...' : 'Loading...'}
            </Text>
          </View>
        ) : (
          <>
            {/* Location Section - Foodpanda Style */}
            <View className="bg-[#F5F5F5] rounded-xl p-4 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
              <View className="flex-row items-center">
                <Text className="text-[#D32F2F] text-xl mr-1">📍</Text>
                <TouchableOpacity 
                  className="flex-1 ml-2"
                  onPress={openLocationInMaps}
                  disabled={!currentLocation}
                >
                  <Text className={`font-medium text-base ${currentLocation ? 'text-[#D32F2F]' : 'text-[#212121]'}`}>
                    {locationLoading ? "Getting location..." : getCurrentAddress()}
                  </Text>
                  {locationError ? (
                    <Text className="text-red-500 text-xs mt-1">{locationError}</Text>
                  ) : null}
                  {currentLocation ? (
                    <Text className="text-green-600 text-xs mt-1">📱 Current location • Tap to view in Maps</Text>
                  ) : null}
                </TouchableOpacity>
                <View className="flex-row items-center">
                  {currentLocation ? (
                    <TouchableOpacity 
                      onPress={getCurrentDeviceLocation}
                      className="mr-3 p-2"
                      disabled={locationLoading}
                    >
                      <Text className="text-[#D32F2F] text-sm">🔄</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={openAddressChange} className="ml-2">
                    <Text className="text-[#D32F2F] font-bold text-sm">Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Get Location Button */}
              {!currentLocation ? (
                <View className="mt-3 pt-3 border-t border-gray-200">
                  <TouchableOpacity 
                    onPress={requestLocationManually}
                    className="bg-[#D32F2F] py-3 px-4 rounded-lg flex-row items-center justify-center"
                    disabled={locationLoading}
                  >
                    <Text className="text-white text-lg mr-2">📍</Text>
                    <Text className="text-white font-semibold text-base">
                      {locationLoading ? "Finding location..." : "Use current location"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F5F5F5] rounded-xl px-4 py-3 mb-6">
              <Search color="#757575" size={20} />
              <TextInput
                className="ml-3 text-[#212121] flex-1"
                placeholder="Search menu..."
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <X size={20} color="#757575" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {searchQuery.trim().length > 0 && (
              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-[#212121]">
                    {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
                  </Text>
                </View>
                {isSearching ? (
                  <Text className="text-[#757575]">Searching for "{searchQuery}"...</Text>
                ) : searchResults.length > 0 ? (
                  <View className="flex-row flex-wrap gap-4">
                    {searchResults.map((item) => (
                      <TouchableOpacity 
                        key={item.id}
                        className="bg-[#F5F5F5] rounded-xl p-4 flex-1 min-w-[45%]"
                        onPress={() => openCustomization(item)}
                      >
                        <View className="items-center mb-3">
        <Image
                            source={{ uri: item.image_url }}
                            className="w-16 h-16 rounded-xl mb-2"
                          />
                          <Text className="text-lg font-bold text-[#212121]">{item.name}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-[#D32F2F] font-bold">
                            PKR {item.sizes?.[0]?.price || 0}
                          </Text>
                          <View className="flex-row items-center">
                            <Star color="#FFC107" size={16} fill="#FFC107" />
                            <Text className="ml-1 text-[#212121]">{item.rating}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500 text-lg">No items found</Text>
                    <Text className="text-gray-400 text-center mt-2">
                      Try searching with different keywords
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Categories - Hide when searching */}
            {searchQuery.trim().length === 0 && (
              <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-[#212121]">Categories</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                  <Text className="text-[#D32F2F] font-medium">View All</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <Text className="text-[#757575]">Loading categories...</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-24">
                  <View className="flex-row gap-3">
                    {categories.map((category) => (
                      <TouchableOpacity 
                        key={category.id}
                        className="bg-[#F5F5F5] rounded-xl px-4 py-3 items-center min-w-[100px]"
                        onPress={() => router.push('/(tabs)/explore')}
                      >
                        <Text className="text-2xl mb-1">{category.icon}</Text>
                        <Text className="text-[#212121] font-medium">{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
            )}

            {/* Featured Pizzas - Hide when searching */}
            {searchQuery.trim().length === 0 && (
              <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-[#212121]">Popular Pizzas</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                  <Text className="text-[#D32F2F] font-medium">View All</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <Text className="text-[#757575]">Loading popular items...</Text>
              ) : (
                <View className="flex-row flex-wrap gap-4">
                  {featuredPizzas.map((pizza) => (
                    <TouchableOpacity 
                      key={pizza.id}
                      className="bg-[#F5F5F5] rounded-xl p-4 flex-1 min-w-[45%]"
                      onPress={() => openCustomization(pizza)}
                    >
                      <View className="items-center mb-3">
                        <OptimizedImage
                          uri={pizza.image_url}
                          width={64}
                          height={64}
                          borderRadius={12}
                          style={{ marginBottom: 8 }}
                          fallbackText="🍕"
                          showLoadingIndicator={true}
                        />
                        <Text className="text-lg font-bold text-[#212121]">{pizza.name}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-[#D32F2F] font-bold">
                          PKR {pizza.sizes?.[0]?.price || 0}
                        </Text>
                        <View className="flex-row items-center">
                          <Star color="#FFC107" size={16} fill="#FFC107" />
                          <Text className="ml-1 text-[#212121]">{pizza.rating}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            )}

           

            {/* Quick Actions - Hide when searching */}
            {searchQuery.trim().length === 0 && (
              <View className="mb-8">
              <Text className="text-xl font-bold text-[#212121] mb-4">Quick Actions</Text>
              <View className="flex-row gap-4">
                <TouchableOpacity 
                  className="bg-[#F5F5F5] rounded-xl p-4 flex-1 items-center"
                  onPress={() => router.push('/(tabs)/orders')}
                >
                  <Clock color="#D32F2F" size={24} />
                  <Text className="mt-2 text-[#212121] font-medium">Track Order</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-[#F5F5F5] rounded-xl p-4 flex-1 items-center"
                  onPress={() => router.push('/build-pizza')}
                >
                  <Pizza color="#D32F2F" size={24} />
                  <Text className="mt-2 text-[#212121] font-medium">Customize Pizza</Text>
                </TouchableOpacity>
              </View>
            </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Customization Modal */}
      <Modal
        visible={customizationModalVisible}
        animationType="slide"
        onRequestClose={() => setCustomizationModalVisible(false)}
        statusBarTranslucent={true}
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header with Swipe Indicator */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <View className="flex-1 items-center">
              <View className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
              <Text className="text-xl font-bold text-gray-900">Customize</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setCustomizationModalVisible(false)}
              className="bg-gray-100 rounded-full p-2 absolute right-4"
            >
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <ScrollView className="px-4">
              {/* Item Header */}
              <View className="items-center py-4">
                <Image
                  source={{ uri: selectedItem.image_url }} 
                  className="w-48 h-48 rounded-2xl mb-4"
                />
                <Text className="text-2xl font-bold text-gray-900">{selectedItem.name}</Text>
                <Text className="text-gray-500 text-center mt-2">{selectedItem.description}</Text>
                <Text className="text-lg font-bold text-red-500 mt-2">
                  Starting from PKR {selectedItem.sizes?.[0]?.price || 0}
                </Text>
              </View>

              {/* Size Selection */}
              <Text className="text-lg font-bold text-gray-900 mt-4 mb-2">Select Size</Text>
              <View className="flex-row flex-wrap mb-4">
                {selectedItem.sizes?.map(size => (
                  <TouchableOpacity
                    key={size.id}
                    className={`border rounded-full px-4 py-2 mr-2 mb-2 ${selectedSize === size.id ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    onPress={() => setSelectedSize(size.id)}
                  >
                    <Text className={selectedSize === size.id ? 'text-red-500 font-medium' : 'text-gray-700'}>
                      {size.size_name} - PKR {size.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quantity Selector */}
              <View className="mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-2">Quantity</Text>
                <View className="flex-row items-center justify-between bg-gray-100 rounded-full p-2 w-32">
                  <TouchableOpacity 
                    className="bg-white rounded-full p-2"
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={16} color="#212121" />
                  </TouchableOpacity>
                  <Text className="text-lg font-bold">{quantity}</Text>
                  <TouchableOpacity 
                    className="bg-white rounded-full p-2"
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={16} color="#212121" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total and Add to Cart */}
              <View className="mt-8 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-gray-900">Total</Text>
                  <Text className="text-2xl font-bold text-red-500">PKR {calculateTotalPrice()}</Text>
                </View>
                <TouchableOpacity 
                  className="bg-red-500 rounded-full py-4 items-center"
                  onPress={addToCart}
                >
                  <Text className="text-white font-bold text-lg">Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Address Change Modal */}
      <Modal
        visible={addressChangeModalVisible}
        animationType="slide"
        onRequestClose={() => setAddressChangeModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setAddressChangeModalVisible(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Change Delivery Address</Text>
            <View className="w-6" />
          </View>
          
          <ScrollView className="px-4 py-6">
            {/* Current Location Option */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-4">Delivery Options</Text>
              <TouchableOpacity
                onPress={handleCurrentLocationSelect}
                disabled={locationLoading || !locationFetched}
                className={`p-4 rounded-xl mb-3 border-2 ${
                  useCurrentLocation
                    ? 'border-blue-500 bg-blue-50'
                    : locationFetched
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
                style={useCurrentLocation ? { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } : undefined}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <MapPin size={20} color={useCurrentLocation ? "#3B82F6" : locationFetched ? "#757575" : "#BDBDBD"} />
                      <Text className={`text-lg font-bold ml-2 ${
                        useCurrentLocation ? 'text-blue-600' : locationFetched ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Current Location
                      </Text>
                      {useCurrentLocation && (
                        <View className="bg-blue-500 px-2 py-1 rounded-full ml-2">
                          <Text className="text-white text-xs font-medium">Selected</Text>
                        </View>
                      )}
                      {locationLoading && !locationFetched && (
                        <View className="bg-gray-400 px-2 py-1 rounded-full ml-2">
                          <Text className="text-white text-xs font-medium">Loading...</Text>
                        </View>
                      )}
                    </View>
                    <Text className={`text-sm ${
                      useCurrentLocation ? 'text-blue-500' : locationFetched ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {locationLoading && !locationFetched
                        ? 'Fetching your location...'
                        : locationFetched && currentLocation 
                          ? LocationService.formatLocationForDisplay(currentLocation)
                          : locationError
                            ? 'Location unavailable - tap to retry'
                            : 'Waiting for location...'
                      }
                    </Text>
                  </View>
                  {useCurrentLocation && (
                    <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                      <View className="w-3 h-3 rounded-full bg-white" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Saved Addresses */}
            {userState.profile?.addresses && userState.profile.addresses.length > 0 ? (
              <View>
                <Text className="text-lg font-bold text-gray-800 mb-4">Saved Addresses</Text>
                {userState.profile.addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    className={`p-4 rounded-xl mb-3 border-2 ${
                      !useCurrentLocation && address.isDefault
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onPress={() => handleAddressSelect(address)}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Text className={`text-lg font-bold ${
                            !useCurrentLocation && address.isDefault ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {address.title}
                          </Text>
                          {!useCurrentLocation && address.isDefault && (
                            <View className="bg-red-500 px-2 py-1 rounded-full ml-2">
                              <Text className="text-white text-xs font-medium">Selected</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600">
                          {address.street}, {address.city}, {address.zip}
                        </Text>
                      </View>
                      {!useCurrentLocation && address.isDefault && (
                        <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center">
                          <View className="w-3 h-3 rounded-full bg-white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="py-8 items-center">
                <MapPin size={48} color="#E0E0E0" />
                <Text className="text-gray-500 text-lg mt-2">No addresses saved</Text>
                <Text className="text-gray-400 text-center mt-1">
                  Add an address in your profile to change delivery location
                </Text>
                <TouchableOpacity 
                  className="bg-red-500 rounded-full px-6 py-3 mt-4"
                  onPress={() => {
                    setAddressChangeModalVisible(false);
                    router.push('/(tabs)/profile');
                  }}
                >
                  <Text className="text-white font-bold">Go to Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>


    </View>
  );
}