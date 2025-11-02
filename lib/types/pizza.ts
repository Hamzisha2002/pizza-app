export interface CrustType {
  id: string;
  name: string;
  description: string;
  priceModifier: number; // multiplier for base price
}

export interface PizzaSize {
  id: string;
  name: string;
  diameter: string;
  servingSize: string;
  basePrice: number;
}

export interface SauceOption {
  id: string;
  name: string;
  spiceLevel: number;
  price: number;
}

export interface ToppingOption {
  id: string;
  name: string;
  category: 'meat' | 'vegetables' | 'cheese';
  price: number;
  image?: string;
}

export interface DealOption {
  id: string;
  name: string;
  description: string;
  price: number;
  items_included: any;
  image?: string;
}

export interface PizzaCustomization {
  crust: CrustType;
  size: PizzaSize;
  sauce: SauceOption;
  toppings: ToppingOption[];
}

export interface CustomPizza {
  id: string;
  customization: PizzaCustomization;
  quantity: number;
  totalPrice: number;
}

// Pizza customization data
export const CRUST_TYPES: CrustType[] = [
  {
    id: 'original',
    name: 'Original Crust',
    description: 'Hand-tossed classic',
    priceModifier: 1.0,
  },
  {
    id: 'thin',
    name: 'Thin Crust',
    description: 'Crispy and light',
    priceModifier: 1.1,
  },
  {
    id: 'pan',
    name: 'Pan Crust',
    description: 'Thick & fluffy',
    priceModifier: 1.2,
  },
];

export const PIZZA_SIZES: PizzaSize[] = [
  {
    id: 'personal',
    name: 'Personal',
    diameter: '6"',
    servingSize: '1 person',
    basePrice: 599,
  },
  {
    id: 'regular',
    name: 'Regular',
    diameter: '9"',
    servingSize: '1-2 people',
    basePrice: 899,
  },
  {
    id: 'medium',
    name: 'Medium',
    diameter: '12"',
    servingSize: '2-3 people',
    basePrice: 1299,
  },
  {
    id: 'large',
    name: 'Large',
    diameter: '15"',
    servingSize: '3-4 people',
    basePrice: 1699,
  },
];

export const SAUCE_OPTIONS: SauceOption[] = [
  {
    id: 'fiery',
    name: 'Fiery Sauce',
    spiceLevel: 3,
    price: 0,
  },
  {
    id: 'garlic',
    name: 'Creamy Garlic',
    spiceLevel: 0,
    price: 50,
  },
  {
    id: 'peri_peri',
    name: 'Peri Peri Sauce',
    spiceLevel: 4,
    price: 75,
  },
];

export const TOPPING_OPTIONS: ToppingOption[] = [
  // Meat
  {
    id: 'chicken',
    name: 'Chicken',
    category: 'meat',
    price: 150,
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    category: 'meat',
    price: 180,
  },
  // Vegetables
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    category: 'vegetables',
    price: 80,
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    category: 'vegetables',
    price: 70,
  },
  {
    id: 'onion',
    name: 'Onion',
    category: 'vegetables',
    price: 50,
  },
  {
    id: 'jalapenos',
    name: 'Jalapeños',
    category: 'vegetables',
    price: 90,
  },
  {
    id: 'olives',
    name: 'Olives',
    category: 'vegetables',
    price: 100,
  },
  // Cheese
  {
    id: 'cheese_blend',
    name: 'Cheese Blend',
    category: 'cheese',
    price: 120,
  },
];

export const DEALS: DealOption[] = [
  {
    id: 'solo_cravings',
    name: 'Solo Cravings',
    description: 'Personal Pizza + Drink',
    price: 599,
    items_included: {
      pizza_size: 'personal',
      drink: true,
    },
  },
  {
    id: 'power_of_3',
    name: 'Power of 3',
    description: 'Medium Pizza + 3 Chicken + Cheesy Bread + 2 Drinks',
    price: 1849,
    items_included: {
      pizza_size: 'medium',
      chicken_pieces: 3,
      cheesy_bread: true,
      drinks: 2,
    },
  },
  {
    id: 'boss_box',
    name: 'The Boss Box',
    description: 'Large + Regular Pizza + 9pc Chicken + 1.5L Drink',
    price: 3599,
    items_included: {
      large_pizza: true,
      regular_pizza: true,
      chicken_pieces: 9,
      large_drink: true,
    },
  },
  {
    id: 'squad_goals',
    name: 'Squad Goals',
    description: '2 Regular Pizzas + 5 Strips + Fries + 1.5L Drink',
    price: 2749,
    items_included: {
      regular_pizzas: 2,
      chicken_strips: 5,
      fries: true,
      large_drink: true,
    },
  },
  {
    id: 'couple_connect',
    name: 'Couple Connect',
    description: 'Regular Pizza + Beverage options',
    price: 1299,
    items_included: {
      pizza_size: 'regular',
      beverages: 2,
    },
  },
  {
    id: 'family_weekend',
    name: 'Family Weekend Box',
    description: '2 Large Pizzas + Fish & Chips + Bread + Chicken + Drink + Dip Platter',
    price: 5499,
    items_included: {
      large_pizzas: 2,
      fish_and_chips: true,
      bread: true,
      chicken: true,
      drink: true,
      dip_platter: true,
    },
  },
];
