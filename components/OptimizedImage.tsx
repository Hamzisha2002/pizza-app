import React, { useState } from 'react';
import { Image, View, Text, ActivityIndicator } from 'react-native';

interface OptimizedImageProps {
  uri: string;
  width: number;
  height: number;
  borderRadius?: number;
  style?: any;
  fallbackText?: string;
  showLoadingIndicator?: boolean;
}

export default function OptimizedImage({
  uri,
  width,
  height,
  borderRadius = 0,
  style = {},
  fallbackText = '🍕',
  showLoadingIndicator = true
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = (error: any) => {
    console.log('OptimizedImage load error:', error.nativeEvent.error);
    setLoading(false);
    setError(true);
  };

  if (error || !uri || uri.trim() === '') {
    return (
      <View style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
      }}>
        <Text style={{ fontSize: width * 0.3 }}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative', width, height, borderRadius, ...style }}>
      <Image
        source={{ 
          uri,
          cache: 'force-cache'
        }}
        style={{
          width,
          height,
          borderRadius,
        }}
        resizeMode="cover"
        fadeDuration={200}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        progressiveRenderingEnabled={true}
        removeClippedSubviews={true}
      />
      
      {loading && showLoadingIndicator && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#F5F5F5',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius
        }}>
          <ActivityIndicator size="small" color="#D32F2F" />
        </View>
      )}
    </View>
  );
}
