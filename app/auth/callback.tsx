import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL parameters
        const url = window.location.href;
        
        // Extract the access_token and refresh_token from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          Alert.alert('Authentication Error', errorDescription || error);
          router.replace('/auth');
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            Alert.alert('Session Error', sessionError.message);
            router.replace('/auth');
          } else {
            // Successfully authenticated
            router.replace('/(tabs)');
          }
        } else {
          // No tokens found, redirect to auth
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        Alert.alert('Error', 'An error occurred during authentication');
        router.replace('/auth');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#D32F2F" />
    </View>
  );
}
