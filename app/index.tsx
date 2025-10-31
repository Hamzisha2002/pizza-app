import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/context/AuthContext';
import { useCart } from '../lib/context/CartContext';
import { useOrder } from '../lib/context/OrderContext';
import { useUser } from '../lib/context/UserContext';

export default function Index() {
  const { isAuthenticated, loading, user, uid } = useAuth();
  const { syncUserWithAuth, clearUserData } = useUser();
  const { loadCartFromServer, syncCartWithServer } = useCart();
  const { loadOrdersByUserId, clearOrders } = useOrder();

  // Sync user data when authentication changes
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user && uid) {
        console.log('🔄 Syncing user data on sign-in...');
        
        // User just signed in - sync ALL their data from database
        await Promise.all([
          syncUserWithAuth(uid, user.email || ''), // Profile & addresses from DB
          loadCartFromServer(uid),                  // Cart from DB
          loadOrdersByUserId(uid),                  // Orders from DB
        ]);
        
        console.log('✅ User data sync completed');
      } else if (!isAuthenticated) {
        console.log('🧹 Clearing user data on sign-out...');
        // User signed out - clear ALL data
        clearUserData();
        clearOrders();
        console.log('✅ User data cleared');
      }
    };

    if (!loading) {
      syncData();
    }
  }, [isAuthenticated, loading, user, uid]);

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}
