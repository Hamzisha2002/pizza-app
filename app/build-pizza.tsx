import { useRouter } from 'expo-router';
import { ArrowLeft, Pizza } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PizzaBuilder from '../components/PizzaBuilder';
import { useCart } from '../lib/context/CartContext';
import { PizzaCustomization } from '../lib/types/pizza';

export default function BuildPizzaScreen() {
  const router = useRouter();
  const { addCustomPizza } = useCart();
  const [pizzaBuilderVisible, setPizzaBuilderVisible] = useState(true);

  const handlePizzaBuilderAdd = (customization: PizzaCustomization, quantity: number, totalPrice: number) => {
    addCustomPizza(customization, quantity, totalPrice);
    Alert.alert('Success', 'Custom pizza added to cart!');
    setPizzaBuilderVisible(false);
    router.back();
  };

  const handleClose = () => {
    setPizzaBuilderVisible(false);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#D32F2F] pt-4 pb-6 px-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={handleClose}
            className="p-2"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Pizza size={28} color="white" />
            <Text className="text-white text-2xl font-bold ml-3">Build Your Pizza</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Pizza Builder */}
      <PizzaBuilder
        visible={pizzaBuilderVisible}
        onClose={handleClose}
        onAddToCart={handlePizzaBuilderAdd}
      />
    </SafeAreaView>
  );
}
