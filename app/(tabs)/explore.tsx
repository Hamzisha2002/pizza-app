import { Filter, Heart, Minus, Pizza, Plus, Search, Star, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OptimizedImage from '../../components/OptimizedImage';
import PizzaBuilder from '../../components/PizzaBuilder';
import { CartItem, useCart } from '../../lib/context/CartContext';
import { MenuService } from '../../lib/services/menuService';
import { Category, MenuItem } from '../../lib/supabase';
import { DEALS, PizzaCustomization } from '../../lib/types/pizza';

const menuCategories = [
  { id: '1', name: 'Popular', icon: '🔥' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Burgers', icon: '🍔' },
  { id: '4', name: 'Sides', icon: '🍟' },
  { id: '5', name: 'Drinks', icon: '🥤' },
  { id: '6', name: 'Desserts', icon: '🍰' },
];

const menuItems = [
  {
    id: '1',
    name: 'Pepperoni Pizza',
    description: 'Classic pizza with pepperoni, mozzarella cheese, and our signature sauce',
    price: 12.99,
    category: '2',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    customizable: true,
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, tomatoes, and basil on our thin crust',
    price: 11.99,
    category: '2',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    customizable: true,
  },
  {
    id: '3',
    name: 'BBQ Chicken Burger',
    description: 'Grilled chicken, bacon, onions, and BBQ sauce',
    price: 9.99,
    category: '3',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    customizable: false,
  },
  {
    id: '4',
    name: 'Garlic Breadsticks',
    description: 'Freshly baked breadsticks with garlic butter and herbs',
    price: 5.99,
    category: '4',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=800&auto=format&fit=crop&q=80',
    customizable: false,
  },
  {
    id: '5',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center and vanilla ice cream',
    price: 6.99,
    category: '6',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1627834373946-0ad183e0015a?w=800&auto=format&fit=crop&q=80',
    customizable: false,
  },
  {
    id: '6',
    name: 'Veggie Supreme Pizza',
    description: 'Bell peppers, mushrooms, onions, olives, and tomatoes',
    price: 13.99,
    category: '2',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    customizable: true,
  },
];

const pizzaToppings = [
  { id: '1', name: 'Extra Cheese', price: 1.5 },
  { id: '2', name: 'Pepperoni', price: 1.0 },
  { id: '3', name: 'Mushrooms', price: 0.75 },
  { id: '4', name: 'Olives', price: 0.75 },
  { id: '5', name: 'Onions', price: 0.5 },
  { id: '6', name: 'Bell Peppers', price: 0.75 },
  { id: '7', name: 'Bacon', price: 1.25 },
  { id: '8', name: 'Ham', price: 1.25 },
];

export default function MenuScreen() {
  const { addItem, addCustomPizza, addDeal } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizationModalVisible, setCustomizationModalVisible] = useState(false);
  const [pizzaBuilderVisible, setPizzaBuilderVisible] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, allMenuItems] = await Promise.all([
          MenuService.getCategories(),
          MenuService.getMenuItems(),
        ]);
        
        // Add "Popular", "Custom Pizza", and "Deals" categories
        const allCategories = [
          { id: 'popular', name: 'Popular', slug: 'popular', icon: '🔥', sort_order: -1, created_at: '' },
          { id: 'custom', name: 'Build Pizza', slug: 'custom', icon: '🍕', sort_order: -1, created_at: '' },
          { id: 'deals', name: 'Deals', slug: 'deals', icon: '🎁', sort_order: -1, created_at: '' },
          ...categoriesData
        ];
        
        setCategories(allCategories);
        setMenuItems(allMenuItems);
      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const filteredItems = 
    searchQuery.trim().length > 0
      ? searchResults
      : selectedCategory === 'Popular' 
      ? menuItems.filter(item => item.is_popular)
      : selectedCategory === 'Build Pizza' || selectedCategory === 'Deals'
      ? []
      : menuItems.filter(item => item.category?.name === selectedCategory);

  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomizationModalVisible(true);
    setSelectedToppings([]);
    setQuantity(1);
    setSelectedSize(item.sizes?.[0]?.id || '');
  };

  const toggleTopping = (topping: string) => {
    if (selectedToppings.includes(topping)) {
      setSelectedToppings(selectedToppings.filter(t => t !== topping));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedItem || !selectedSize) return 0;
    const size = selectedItem.sizes?.find(s => s.id === selectedSize);
    if (!size) return 0;
    
    const toppingsTotal = selectedToppings.length * 50; // PKR 50 per topping
    return (size.price + toppingsTotal) * quantity;
  };

  const addToCart = () => {
    if (!selectedItem || !selectedSize) {
      Alert.alert('Error', 'Please select a size');
      return;
    }

    const size = selectedItem.sizes?.find(s => s.id === selectedSize);
    if (!size) return;

    const cartItem: CartItem = {
      id: `${selectedItem.id}-${selectedSize}-${selectedToppings.join(',')}`,
      type: 'menu_item',
      menuItem: selectedItem,
      size: size,
      quantity: quantity,
      customizations: {
        toppings: selectedToppings,
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

  const handlePizzaBuilderAdd = (customization: PizzaCustomization, quantity: number, totalPrice: number) => {
    addCustomPizza(customization, quantity, totalPrice);
    Alert.alert('Success', 'Custom pizza added to cart!');
  };

  const handleDealAdd = (deal: any) => {
    addDeal(deal, 1);
    Alert.alert('Success', `${deal.name} added to cart!`);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === item.id ? 'bg-red-500' : 'bg-gray-100'}`}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text className={`font-medium ${selectedCategory === item.id ? 'text-white' : 'text-gray-700'}`}>
        {item.icon} {item.name}
      </Text>
    </TouchableOpacity>
  );

  const quickAddToCart = (item: MenuItem) => {
    console.log('Quick add to cart called for:', item.name);
    const defaultSize = item.sizes?.[0];
    if (!defaultSize) {
      console.log('No default size found for item:', item.name);
      return;
    }

    const cartItem: CartItem = {
      id: `${item.id}-${defaultSize.id}`,
      type: 'menu_item',
      menuItem: item,
      size: defaultSize,
      quantity: 1,
      customizations: {},
      totalPrice: defaultSize.price,
      name: item.name,
      description: item.description,
      image: item.image_url,
    };

    console.log('Adding cart item:', cartItem);
    addItem(cartItem);
    Alert.alert('Success', `${item.name} added to cart!`);
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View className="bg-white rounded-2xl mb-4 p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
      <TouchableOpacity 
        className="flex-row"
        onPress={() => openCustomization(item)}
      >
        <OptimizedImage
          uri={item.image_url}
          width={80}
          height={80}
          borderRadius={12}
          fallbackText="🍕"
          showLoadingIndicator={true}
        />
        <View className="ml-4 flex-1">
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
            <TouchableOpacity>
              <Heart size={20} color="#757575" fill="transparent" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
          <View className="flex-row items-center mt-2">
            <Star size={16} color="#FFC107" fill="#FFC107" />
            <Text className="text-gray-700 ml-1 font-medium">{item.rating}</Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-lg font-bold text-red-500">
              PKR {item.sizes?.[0]?.price || 0}
            </Text>
            <Text className="text-xs text-orange-500 font-medium">Customizable</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Quick Add Button */}
      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity 
          className="flex-1 bg-gray-100 rounded-xl py-2 items-center"
          onPress={() => openCustomization(item)}
        >
          <Text className="text-gray-700 font-medium">Customize</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 bg-red-500 rounded-xl py-2 items-center"
          onPress={() => quickAddToCart(item)}
        >
          <Text className="text-white font-bold">Quick Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">Menu</Text>
          <TouchableOpacity>
            <Filter size={24} color="#212121" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2 mb-4">
          <Search size={20} color="#757575" />
          <TextInput
            className="ml-2 text-gray-900 flex-1"
            placeholder="Search menu items..."
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
      </View>

      {/* Categories */}
      <View className="py-3 bg-white">
        {loading ? (
          <Text className="px-4 text-gray-500">Loading categories...</Text>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === category.name ? 'bg-red-500' : 'bg-gray-100'}`}
                onPress={() => {
                  setSelectedCategory(category.name);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text className={`font-medium ${selectedCategory === category.name ? 'text-white' : 'text-gray-700'}`}>
                  {category.icon} {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Special Content for Build Pizza */}
      {selectedCategory === 'Build Pizza' && (
        <View className="p-4">
          <TouchableOpacity
            className="bg-red-500 rounded-2xl p-6 mb-4"
            onPress={() => setPizzaBuilderVisible(true)}
          >
            <View className="items-center">
              <Pizza size={48} color="white" />
              <Text className="text-white text-2xl font-bold mt-3">Build Your Pizza</Text>
              <Text className="text-white text-center mt-2 opacity-90">
                Create your perfect pizza with our 4-step builder
              </Text>
              <View className="bg-white/20 rounded-full px-4 py-2 mt-4">
                <Text className="text-white font-bold">Start Building →</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Special Content for Deals */}
      {selectedCategory === 'Deals' && (
        <ScrollView className="p-4">
          {DEALS.map((deal) => (
            <TouchableOpacity
              key={deal.id}
              className="bg-white rounded-2xl mb-4 p-4 border border-orange-200"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}
              onPress={() => handleDealAdd(deal)}
            >
              <View className="flex-row items-center mb-2">
                <View className="bg-orange-100 rounded-full p-2 mr-3">
                  <Text className="text-orange-600 text-lg">🎁</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900">{deal.name}</Text>
                  <Text className="text-2xl font-bold text-red-600">PKR {deal.price}</Text>
                </View>
              </View>
              <Text className="text-gray-600 mb-3">{deal.description}</Text>
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="text-green-800 font-medium text-center">
                  Tap to Add Deal to Cart
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Regular Menu Items */}
      {selectedCategory !== 'Build Pizza' && selectedCategory !== 'Deals' && (
        <>
          {/* Search Results Indicator */}
          {searchQuery.trim().length > 0 && (
            <View className="px-4 py-2 bg-blue-50 border-b border-blue-200">
              <Text className="text-blue-800 font-medium">
                {isSearching ? 'Searching...' : `Found ${searchResults.length} results for "${searchQuery}"`}
              </Text>
            </View>
          )}
          
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            className="px-4 mt-2 flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 120, // Approximate item height
              offset: 120 * index,
              index,
            })}
            ListEmptyComponent={
              searchQuery.trim().length > 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-gray-500 text-lg">No items found</Text>
                  <Text className="text-gray-400 text-center mt-2">
                    Try searching with different keywords
                  </Text>
                </View>
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-gray-500 text-lg">No items in this category</Text>
                </View>
              )
            }
          />
        </>
      )}

      {/* Customization Modal */}
      <Modal
        visible={customizationModalVisible}
        animationType="slide"
        onRequestClose={() => setCustomizationModalVisible(false)}
        statusBarTranslucent={true}
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <StatusBar backgroundColor="white" barStyle="dark-content" />
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
                <OptimizedImage
                  uri={selectedItem.image_url}
                  width={192}
                  height={192}
                  borderRadius={16}
                  style={{ marginBottom: 16 }}
                  fallbackText="🍕"
                  showLoadingIndicator={true}
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

      {/* Pizza Builder */}
      <PizzaBuilder
        visible={pizzaBuilderVisible}
        onClose={() => setPizzaBuilderVisible(false)}
        onAddToCart={handlePizzaBuilderAdd}
      />
    </View>
  );
}