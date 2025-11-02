import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { X, ChevronLeft, ChevronRight, Star } from 'lucide-react-native';
import {
  CRUST_TYPES,
  PIZZA_SIZES,
  SAUCE_OPTIONS,
  TOPPING_OPTIONS,
  CrustType,
  PizzaSize,
  SauceOption,
  ToppingOption,
  PizzaCustomization,
} from '../lib/types/pizza';

interface PizzaBuilderProps {
  visible: boolean;
  onClose: () => void;
  onAddToCart: (customization: PizzaCustomization, quantity: number, totalPrice: number) => void;
}

export default function PizzaBuilder({ visible, onClose, onAddToCart }: PizzaBuilderProps) {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  
  // Customization state
  const [selectedCrust, setSelectedCrust] = useState<CrustType>(CRUST_TYPES[0]);
  const [selectedSize, setSelectedSize] = useState<PizzaSize>(PIZZA_SIZES[1]);
  const [selectedSauce, setSelectedSauce] = useState<SauceOption>(SAUCE_OPTIONS[0]);
  const [selectedToppings, setSelectedToppings] = useState<ToppingOption[]>([]);

  const calculatePrice = () => {
    const basePrice = selectedSize.basePrice * selectedCrust.priceModifier;
    const saucePrice = selectedSauce.price;
    const toppingsPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    return Math.round((basePrice + saucePrice + toppingsPrice) * quantity);
  };

  const toggleTopping = (topping: ToppingOption) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    const customization: PizzaCustomization = {
      crust: selectedCrust,
      size: selectedSize,
      sauce: selectedSauce,
      toppings: selectedToppings,
    };
    
    onAddToCart(customization, quantity, calculatePrice());
    onClose();
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetBuilder = () => {
    setStep(1);
    setQuantity(1);
    setSelectedCrust(CRUST_TYPES[0]);
    setSelectedSize(PIZZA_SIZES[1]);
    setSelectedSauce(SAUCE_OPTIONS[0]);
    setSelectedToppings([]);
  };

  useEffect(() => {
    if (visible) {
      resetBuilder();
    }
  }, [visible]);

  const getSpiceStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        color={i < level ? "#FF4444" : "#E0E0E0"}
        fill={i < level ? "#FF4444" : "#E0E0E0"}
      />
    ));
  };

  const groupedToppings = TOPPING_OPTIONS.reduce((acc, topping) => {
    if (!acc[topping.category]) {
      acc[topping.category] = [];
    }
    acc[topping.category].push(topping);
    return acc;
  }, {} as Record<string, ToppingOption[]>);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-[#D32F2F] pt-12 pb-4 px-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Build Your Pizza</Text>
            <View className="w-6" />
          </View>
          
          {/* Progress Indicator */}
          <View className="flex-row mt-4 space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <View
                key={stepNum}
                className={`flex-1 h-2 rounded-full ${
                  stepNum <= step ? 'bg-white' : 'bg-red-300'
                }`}
              />
            ))}
          </View>
          
          <Text className="text-white text-center mt-2">
            Step {step} of 4: {
              step === 1 ? 'Choose Crust' :
              step === 2 ? 'Select Size' :
              step === 3 ? 'Pick Sauce' :
              'Add Toppings'
            }
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Step 1: Crust Selection */}
          {step === 1 && (
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Choose Your Crust
              </Text>
              
              {CRUST_TYPES.map((crust) => (
                <TouchableOpacity
                  key={crust.id}
                  className={`p-4 rounded-xl mb-4 border-2 ${
                    selectedCrust.id === crust.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setSelectedCrust(crust)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-lg font-bold ${
                        selectedCrust.id === crust.id ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {crust.name}
                      </Text>
                      <Text className="text-gray-500 mt-1">{crust.description}</Text>
                      {crust.priceModifier !== 1.0 && (
                        <Text className="text-sm text-orange-600 mt-1">
                          +{Math.round((crust.priceModifier - 1) * 100)}% price
                        </Text>
                      )}
                    </View>
                    {selectedCrust.id === crust.id && (
                      <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-white" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 2: Size Selection */}
          {step === 2 && (
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Select Your Size
              </Text>
              
              {PIZZA_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  className={`p-4 rounded-xl mb-4 border-2 ${
                    selectedSize.id === size.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setSelectedSize(size)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-lg font-bold ${
                        selectedSize.id === size.id ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {size.name} ({size.diameter})
                      </Text>
                      <Text className="text-gray-500 mt-1">{size.servingSize}</Text>
                      <Text className="text-green-600 font-medium mt-1">
                        PKR {Math.round(size.basePrice * selectedCrust.priceModifier)}
                      </Text>
                    </View>
                    {selectedSize.id === size.id && (
                      <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-white" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 3: Sauce Selection */}
          {step === 3 && (
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Pick Your Sauce
              </Text>
              
              {SAUCE_OPTIONS.map((sauce) => (
                <TouchableOpacity
                  key={sauce.id}
                  className={`p-4 rounded-xl mb-4 border-2 ${
                    selectedSauce.id === sauce.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setSelectedSauce(sauce)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-lg font-bold ${
                        selectedSauce.id === sauce.id ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {sauce.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 mr-2">Spice Level:</Text>
                        <View className="flex-row">
                          {getSpiceStars(sauce.spiceLevel)}
                        </View>
                      </View>
                      {sauce.price > 0 && (
                        <Text className="text-orange-600 font-medium mt-1">
                          +PKR {sauce.price}
                        </Text>
                      )}
                    </View>
                    {selectedSauce.id === sauce.id && (
                      <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-white" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 4: Toppings Selection */}
          {step === 4 && (
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Add Your Toppings
              </Text>
              
              {Object.entries(groupedToppings).map(([category, toppings]) => (
                <View key={category} className="mb-6">
                  <Text className="text-lg font-bold text-gray-800 mb-3 capitalize">
                    {category}
                  </Text>
                  
                  <View className="flex-row flex-wrap">
                    {toppings.map((topping) => {
                      const isSelected = selectedToppings.some(t => t.id === topping.id);
                      return (
                        <TouchableOpacity
                          key={topping.id}
                          className={`p-3 rounded-lg mb-2 mr-2 border-2 ${
                            isSelected
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-white'
                          }`}
                          onPress={() => toggleTopping(topping)}
                        >
                          <Text className={`font-medium ${
                            isSelected ? 'text-red-600' : 'text-gray-800'
                          }`}>
                            {topping.name}
                          </Text>
                          <Text className="text-sm text-green-600 mt-1">
                            +PKR {topping.price}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              
              {selectedToppings.length > 0 && (
                <View className="bg-gray-50 rounded-xl p-4 mt-4">
                  <Text className="font-bold text-gray-800 mb-2">Selected Toppings:</Text>
                  {selectedToppings.map((topping) => (
                    <Text key={topping.id} className="text-gray-600">
                      • {topping.name} (+PKR {topping.price})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 p-4">
          {/* Price Display */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Base Price ({selectedSize.name})</Text>
              <Text className="font-medium">
                PKR {Math.round(selectedSize.basePrice * selectedCrust.priceModifier)}
              </Text>
            </View>
            
            {selectedSauce.price > 0 && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">{selectedSauce.name}</Text>
                <Text className="font-medium">+PKR {selectedSauce.price}</Text>
              </View>
            )}
            
            {selectedToppings.map((topping) => (
              <View key={topping.id} className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">{topping.name}</Text>
                <Text className="font-medium">+PKR {topping.price}</Text>
              </View>
            ))}
            
            <View className="border-t border-gray-300 pt-2 mt-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold">Total</Text>
                <Text className="text-lg font-bold text-red-600">
                  PKR {calculatePrice()}
                </Text>
              </View>
            </View>
          </View>

          {/* Quantity Selector */}
          <View className="flex-row items-center justify-center mb-4">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text className="text-lg font-bold">-</Text>
            </TouchableOpacity>
            <Text className="mx-6 text-xl font-bold">{quantity}</Text>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-red-100 items-center justify-center"
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text className="text-lg font-bold text-red-600">+</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row space-x-3">
            {step > 1 && (
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
                onPress={prevStep}
              >
                <View className="flex-row items-center">
                  <ChevronLeft size={20} color="#666" />
                  <Text className="text-gray-700 font-medium ml-1">Back</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {step < 4 ? (
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                onPress={nextStep}
              >
                <View className="flex-row items-center">
                  <Text className="text-white font-bold mr-1">Next</Text>
                  <ChevronRight size={20} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                onPress={handleAddToCart}
              >
                <Text className="text-white font-bold">
                  Add to Cart - PKR {calculatePrice()}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
