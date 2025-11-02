# Data Synchronization System - Big Boss Pizza Mobile

## Overview
This document explains how user data is synchronized across devices using Supabase as the backend. Every user's data is tied to their unique user ID (UID) from Supabase Auth, ensuring data persistence and cross-device access.

## Architecture

### Authentication Flow
1. User signs up/signs in using Supabase Auth (email/password)
2. Supabase generates a unique `user_id` (UUID)
3. Upon successful authentication:
   - User profile is created/fetched from `user_profiles` table
   - User preferences are initialized in `user_preferences` table
   - Cart session is loaded from `user_cart_sessions` table
   - Address book is loaded from `user_addresses` table

### Data Entities

#### 1. User Profiles (`user_profiles`)
**Purpose**: Stores basic user information

**Fields**:
- `id` (UUID) - Profile ID
- `user_id` (UUID) - Links to Supabase Auth user
- `email` (text) - User email
- `name` (text) - User's display name
- `phone` (text) - Contact number
- `avatar_url` (text) - Profile picture URL
- `created_at`, `updated_at` (timestamptz)

**RLS Policies**:
- Users can view, update, and insert their own profile
- Authenticated via `auth.uid() = user_id`

---

#### 2. User Addresses (`user_addresses`)
**Purpose**: Stores multiple delivery addresses per user

**Fields**:
- `id` (UUID) - Address ID
- `user_profile_id` (UUID) - Links to user profile
- `title` (text) - Address label (e.g., "Home", "Office")
- `street` (text) - Street address
- `city` (text) - City name
- `zip_code` (text) - Postal code
- `is_default` (boolean) - Default delivery address flag
- `created_at`, `updated_at` (timestamptz)

**RLS Policies**:
- Users can view, insert, update, and delete their own addresses
- Authenticated via user_profile relationship

---

#### 3. User Preferences (`user_preferences`)
**Purpose**: Stores app settings and preferences

**Fields**:
- `id` (UUID) - Preference ID
- `user_id` (UUID) - Links to Supabase Auth user
- `notifications_enabled` (boolean) - Push notifications toggle
- `promotional_notifications` (boolean) - Marketing emails toggle
- `order_updates_enabled` (boolean) - Order status notifications
- `dark_mode_enabled` (boolean) - UI theme preference
- `preferred_payment_method` (text) - Default payment method
- `delivery_instructions` (text) - Standing delivery notes
- `created_at`, `updated_at` (timestamptz)

**RLS Policies**:
- Users can view, insert, update, and delete their own preferences
- Authenticated via `auth.uid() = user_id`

---

#### 4. Cart Sessions (`user_cart_sessions`)
**Purpose**: Persistent shopping cart across devices

**Fields**:
- `id` (UUID) - Cart session ID
- `user_id` (UUID) - Links to Supabase Auth user
- `cart_items` (JSONB) - Array of cart items
- `total_amount` (numeric) - Cart total
- `created_at`, `updated_at` (timestamptz)

**Cart Item Structure** (JSONB):
```json
{
  "id": "unique_item_id",
  "type": "menu_item|custom_pizza|deal",
  "name": "Item name",
  "description": "Item description",
  "quantity": 1,
  "totalPrice": 999.99,
  "menuItem": {...},
  "size": {...},
  "customizations": {...}
}
```

**RLS Policies**:
- Users can view, insert, update, and delete their own cart sessions
- Authenticated via `auth.uid() = user_id`

**Sync Behavior**:
- On login: Merges local cart with server cart
- On cart change: Automatically syncs to server
- On logout: Clears local cart, keeps server cart

---

#### 5. Orders (`orders`)
**Purpose**: Stores placed orders with full history

**Fields**:
- `id` (UUID) - Order ID
- `order_number` (text) - Human-readable order number (e.g., BBP-1234567890)
- `user_id` (UUID) - Links to Supabase Auth user
- `user_profile_id` (UUID) - Links to user profile
- `customer_name`, `customer_email`, `customer_phone` (text) - Contact info
- `delivery_address` (JSONB) - Delivery location
- `order_notes` (text) - Special instructions
- `payment_method` (text) - Payment type
- `subtotal`, `tax_amount`, `delivery_fee`, `total_amount` (numeric) - Pricing
- `order_status` (text) - pending, preparing, delivering, delivered, cancelled
- `payment_status` (text) - pending, paid, failed
- `estimated_delivery_time` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**RLS Policies**:
- Users can view their own orders
- Users can insert their own orders
- Users can update their own orders (limited fields)
- Authenticated via `auth.uid() = user_id`

**Related Tables**:
- `order_items` - Individual items in each order
- `order_status_history` - Tracking status changes

---

## Services

### 1. UserProfileService (`lib/services/userProfileService.ts`)
**Methods**:
- `getOrCreateProfile(userId, email)` - Auto-creates profile on first login
- `updateProfile(userId, updates)` - Updates profile fields
- `getAddresses(userProfileId)` - Fetches all addresses
- `addAddress(userProfileId, address)` - Adds new address
- `updateAddress(addressId, userProfileId, updates)` - Updates address
- `deleteAddress(addressId, userProfileId)` - Removes address
- `setDefaultAddress(addressId, userProfileId)` - Sets default address
- `getOrCreatePreferences(userId)` - Auto-creates preferences
- `updatePreferences(userId, updates)` - Updates preferences

---

### 2. CartSyncService (`lib/services/cartSyncService.ts`)
**Methods**:
- `getCart(userId)` - Fetches cart from server
- `syncCart(userId, cartItems, totalAmount)` - Saves cart to server
- `clearCart(userId)` - Empties server cart
- `deleteCart(userId)` - Removes cart session
- `mergeAndSyncCart(userId, localCart, localTotal)` - Intelligent merge on login

**Merge Logic**:
1. Get local cart (from AsyncStorage)
2. Get server cart (from Supabase)
3. Merge: Keep local items + add server items not in local
4. Calculate new total
5. Sync merged cart to server
6. Return merged cart to update UI

---

### 3. OrderService (`lib/services/orderService.ts`)
**Methods**:
- `createOrder(orderData)` - Places new order with user_id
- `getOrderById(orderId)` - Fetches single order
- `getOrdersByUserId(userId)` - All orders for user
- `getActiveOrdersByUserId(userId)` - Current/in-progress orders
- `getOrderHistoryByUserId(userId)` - Completed/cancelled orders
- `updateOrderStatus(orderId, status, notes)` - Updates order state
- `getOrderItems(orderId)` - Items in an order
- `getOrderStatusHistory(orderId)` - Status change timeline

---

## Context Integration

### UserContext (`lib/context/UserContext.tsx`)
**New Methods**:
- `syncUserWithAuth(userId, email)` - Called on login to fetch user data
- `clearUserData()` - Called on logout to clear local data

**Sync Flow**:
1. On login → `syncUserWithAuth` fetches profile + addresses from Supabase
2. Updates local state
3. Saves to AsyncStorage for offline access
4. On logout → Clears local state and AsyncStorage

---

### CartContext (`lib/context/CartContext.tsx`)
**New Methods**:
- `syncCartWithServer(userId)` - Saves current cart to Supabase
- `loadCartFromServer(userId)` - Fetches and merges cart on login

**Sync Flow**:
1. On login → `loadCartFromServer` merges local + server carts
2. On cart change → Auto-saves to AsyncStorage
3. Periodic sync to Supabase (optional enhancement)
4. On logout → Keeps cart in Supabase, clears local

---

### AuthContext (`lib/context/AuthContext.tsx`)
**Enhancements**:
- Exposes `uid` alongside `user` and `session`
- Triggers sync in `app/index.tsx` on auth state change

---

## App Entry Point (`app/index.tsx`)

**Sync Trigger**:
```typescript
useEffect(() => {
  const syncData = async () => {
    if (isAuthenticated && user && uid) {
      // User just signed in - sync their data
      await syncUserWithAuth(uid, user.email || '');
      await loadCartFromServer(uid);
    } else if (!isAuthenticated) {
      // User signed out - clear data
      clearUserData();
    }
  };

  if (!loading) {
    syncData();
  }
}, [isAuthenticated, loading, user, uid]);
```

---

## Security: Row Level Security (RLS)

All tables have RLS enabled with policies that:
1. **Verify authentication**: Only authenticated users can access data
2. **Enforce ownership**: Users can only access their own data via `auth.uid()`
3. **Prevent unauthorized access**: No cross-user data leaks

**Example Policy** (user_cart_sessions):
```sql
-- SELECT: Users can view their own cart
CREATE POLICY "Users can view their own cart sessions"
ON user_cart_sessions FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can insert their own cart
CREATE POLICY "Users can insert their own cart sessions"
ON user_cart_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Cross-Device Behavior

### Scenario 1: User logs in on new device
1. Local cart is empty (or has guest items)
2. `loadCartFromServer` fetches server cart
3. Merges local + server carts
4. User sees all items from previous device + any new items

### Scenario 2: User adds items on Device A, logs into Device B
1. Device A syncs cart to Supabase
2. Device B loads cart from Supabase
3. Device B shows items added on Device A

### Scenario 3: User logs out
1. Local cart cleared
2. User profile cleared from AsyncStorage
3. Server data remains intact
4. Next login restores everything

---

## Testing the Sync System

### 1. Test User Profile Sync
```typescript
// Sign up new user
await signUp('test@example.com', 'password123');
// Check Supabase - user_profiles should have new entry

// Update profile
await UserProfileService.updateProfile(uid, { name: 'John Doe', phone: '+923001234567' });
// Check Supabase - user_profiles should be updated
```

### 2. Test Cart Sync
```typescript
// Add items to cart
addItem(pizzaItem);
// Check Supabase - user_cart_sessions should have cart_items array

// Login on different device
await signIn('test@example.com', 'password123');
// Cart should load with items from first device
```

### 3. Test Order History
```typescript
// Place order
await OrderService.createOrder({
  user_id: uid,
  customer_email: user.email,
  // ... other fields
});

// Fetch orders
const orders = await OrderService.getOrdersByUserId(uid);
// Should return the placed order
```

---

## Migration Notes

### For Existing Users
- Old data in local AsyncStorage will be preserved
- On first login after update, data will sync to Supabase
- Old orders without `user_id` will need manual migration

### Data Migration Script (if needed)
```sql
-- Link old orders to user profiles by email
UPDATE orders
SET user_id = (
  SELECT user_id FROM user_profiles 
  WHERE user_profiles.email = orders.customer_email
)
WHERE user_id IS NULL AND user_profile_id IS NOT NULL;
```

---

## Future Enhancements

1. **Real-time Sync**: Use Supabase Realtime to instantly update carts across devices
2. **Offline Support**: Queue changes when offline, sync when online
3. **Conflict Resolution**: Handle simultaneous edits from multiple devices
4. **Analytics**: Track user behavior across sessions
5. **Push Notifications**: Alert users about order status on all devices

---

## Support

For questions or issues with data synchronization:
1. Check Supabase logs for RLS policy errors
2. Verify `user_id` is correctly set in all tables
3. Ensure auth token is valid and not expired
4. Test RLS policies in Supabase SQL editor

---

**Last Updated**: October 8, 2025
**Version**: 1.0.0

