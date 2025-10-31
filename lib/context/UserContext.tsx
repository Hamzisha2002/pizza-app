import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { UserProfileService } from '../services/userProfileService';
import { UserService } from '../services/userService';
import { supabase } from '../supabase';

export interface UserAddress {
  id: string;
  title: string;
  street: string;
  city: string;
  zip: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: UserAddress[];
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
}

type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ADDRESS'; payload: UserAddress }
  | { type: 'UPDATE_ADDRESS'; payload: { id: string; address: Partial<UserAddress> } }
  | { type: 'DELETE_ADDRESS'; payload: string }
  | { type: 'SET_DEFAULT_ADDRESS'; payload: string };

const initialState: UserState = {
  profile: null,
  isLoading: false,
};

const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_PROFILE':
      return { ...state, profile: action.payload, isLoading: false };

    case 'UPDATE_PROFILE':
      if (!state.profile) return state;
      return {
        ...state,
        profile: { ...state.profile, ...action.payload },
      };

    case 'ADD_ADDRESS':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          addresses: [...state.profile.addresses, action.payload],
        },
      };

    case 'UPDATE_ADDRESS':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          addresses: state.profile.addresses.map(addr =>
            addr.id === action.payload.id
              ? { ...addr, ...action.payload.address }
              : addr
          ),
        },
      };

    case 'DELETE_ADDRESS':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          addresses: state.profile.addresses.filter(addr => addr.id !== action.payload),
        },
      };

    case 'SET_DEFAULT_ADDRESS':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          addresses: state.profile.addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === action.payload,
          })),
        },
      };

    default:
      return state;
  }
};

interface UserContextType {
  state: UserState;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  loadUserData: () => Promise<void>;
  saveUserData: () => Promise<void>;
  syncUserWithAuth: (userId: string, email: string) => Promise<void>;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Load user data on app start - will be overridden by syncUserWithAuth if user is authenticated
  useEffect(() => {
    loadUserData();
  }, []);

  // Save user data to AsyncStorage whenever profile changes
  useEffect(() => {
    if (state.profile) {
      saveUserData();
    }
  }, [state.profile]);

  const loadUserData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.id) {
        console.log('🔄 UserContext: Loading user data from database for authenticated user...');
        
        // User is authenticated - fetch from database
        try {
          const profile = await UserProfileService.getOrCreateProfile(user.id, user.email || '');
          
          if (profile) {
            // Get addresses from database
            console.log('🔄 UserContext: Fetching addresses from database...');
            const addresses = await UserProfileService.getAddresses(profile.id);
            console.log('📋 UserContext: Found addresses:', addresses.length);
            
            const userProfile: UserProfile = {
              id: profile.id,
              name: profile.name || user.email?.split('@')[0] || '',
              email: profile.email,
              phone: profile.phone || '',
              avatar: profile.avatar_url,
              addresses: addresses.map(addr => ({
                id: addr.id,
                title: addr.title,
                street: addr.street,
                city: addr.city,
                zip: addr.zip_code,
                isDefault: addr.is_default,
              })),
            };
            
            dispatch({ type: 'SET_PROFILE', payload: userProfile });
            
            // Save to AsyncStorage for offline access
            await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
            await AsyncStorage.setItem('userPhone', userProfile.phone);
            await AsyncStorage.setItem('userId', user.id);
            
            console.log('✅ UserContext: User data loaded from database with', userProfile.addresses.length, 'addresses');
            return;
          }
        } catch (error) {
          console.error('UserContext: Error loading from database:', error);
        }
      }
      
      // Fallback: Try to load from AsyncStorage (for offline mode)
      console.log('📱 UserContext: Loading user data from local storage (offline mode)...');
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile);
        dispatch({ type: 'SET_PROFILE', payload: profile });
        console.log('✅ UserContext: User data loaded from local storage with', profile.addresses.length, 'addresses');
        return;
      }
      
      // Create default profile if none exists
      console.log('🆕 UserContext: Creating default user profile...');
      const defaultProfile: UserProfile = {
        id: 'default-user',
        name: '',
        email: '',
        phone: '',
        addresses: [],
      };
      dispatch({ type: 'SET_PROFILE', payload: defaultProfile });
      
    } catch (error) {
      console.error('UserContext: Error loading user data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveUserData = async () => {
    try {
      if (state.profile && state.profile.phone) {
        // Save to AsyncStorage
        await AsyncStorage.setItem('userProfile', JSON.stringify(state.profile));
        await AsyncStorage.setItem('userPhone', state.profile.phone);
        
        // Sync to Supabase
        try {
          // Create or update user profile
          const supabaseProfile = await UserService.createOrUpdateUserProfile(
            state.profile.phone,
            {
              name: state.profile.name,
              email: state.profile.email,
              avatar_url: state.profile.avatar,
            }
          );
          
          // Update local profile with Supabase ID
          if (state.profile.id === 'default-user' || state.profile.id !== supabaseProfile.id) {
            dispatch({ 
              type: 'UPDATE_PROFILE', 
              payload: { id: supabaseProfile.id } 
            });
          }
          
          // Sync addresses
          for (const address of state.profile.addresses) {
            if (address.id.startsWith('address_')) {
              // New address - create in Supabase
              await UserService.createUserAddress({
                user_profile_id: supabaseProfile.id,
                title: address.title,
                street: address.street,
                city: address.city,
                zip_code: address.zip,
                is_default: address.isDefault,
              });
            } else {
              // Existing address - update in Supabase
              await UserService.updateUserAddress(address.id, {
                title: address.title,
                street: address.street,
                city: address.city,
                zip_code: address.zip,
                is_default: address.isDefault,
              });
            }
          }
        } catch (error) {
          console.log('Could not sync to Supabase:', error);
          // Continue with local storage even if Supabase fails
        }
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
    
    // Sync to Supabase if user is authenticated
    const userId = await AsyncStorage.getItem('userId');
    if (userId && state.profile) {
      try {
        await UserProfileService.updateProfile(userId, {
          name: profile.name,
          phone: profile.phone,
          avatar_url: profile.avatar,
        });
      } catch (error) {
        console.error('Error updating profile in Supabase:', error);
      }
    }
  };

  const addAddress = async (address: Omit<UserAddress, 'id'>) => {
    const userId = await AsyncStorage.getItem('userId');
    
    if (userId && state.profile && state.profile.id !== 'default-user') {
      try {
        // Add to Supabase first
        const { data: newAddress, error } = await UserProfileService.addAddress(state.profile.id, {
          title: address.title,
          street: address.street,
          city: address.city,
          zip_code: address.zip,
          is_default: address.isDefault,
        });

        if (error) {
          console.error('Error adding address to Supabase:', error);
          throw error;
        }

        if (newAddress) {
          // Refresh all addresses from Supabase to get latest state
          const allAddresses = await UserProfileService.getAddresses(state.profile.id);
          
          // Update profile with all addresses
          const updatedProfile = {
            ...state.profile,
            addresses: allAddresses.map(addr => ({
              id: addr.id,
              title: addr.title,
              street: addr.street,
              city: addr.city,
              zip: addr.zip_code,
              isDefault: addr.is_default,
            })),
          };
          
          dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
          await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        }
      } catch (error) {
        console.error('Error adding address to Supabase:', error);
        throw error;
      }
    } else {
      // No auth, just add locally
      const newAddress: UserAddress = {
        ...address,
        id: `address_${Date.now()}_${Math.random()}`,
      };
      dispatch({ type: 'ADD_ADDRESS', payload: newAddress });
    }
  };

  const updateAddress = async (id: string, address: Partial<UserAddress>) => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId && state.profile && state.profile.id !== 'default-user') {
      try {
        await UserProfileService.updateAddress(id, state.profile.id, {
          title: address.title,
          street: address.street,
          city: address.city,
          zip_code: address.zip,
          is_default: address.isDefault,
        });
        
        // Refresh all addresses from Supabase to get latest state
        const allAddresses = await UserProfileService.getAddresses(state.profile.id);
        
        // Update profile with all addresses
        const updatedProfile = {
          ...state.profile,
          addresses: allAddresses.map(addr => ({
            id: addr.id,
            title: addr.title,
            street: addr.street,
            city: addr.city,
            zip: addr.zip_code,
            isDefault: addr.is_default,
          })),
        };
        
        dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      } catch (error) {
        console.error('Error updating address in Supabase:', error);
        throw error;
      }
    } else {
      // No auth, just update locally
      dispatch({ type: 'UPDATE_ADDRESS', payload: { id, address } });
    }
  };

  const deleteAddress = async (id: string) => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId && state.profile && state.profile.id !== 'default-user') {
      try {
        await UserProfileService.deleteAddress(id, state.profile.id);
        
        // Refresh all addresses from Supabase to get latest state
        const allAddresses = await UserProfileService.getAddresses(state.profile.id);
        
        // Update profile with all addresses
        const updatedProfile = {
          ...state.profile,
          addresses: allAddresses.map(addr => ({
            id: addr.id,
            title: addr.title,
            street: addr.street,
            city: addr.city,
            zip: addr.zip_code,
            isDefault: addr.is_default,
          })),
        };
        
        dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      } catch (error) {
        console.error('Error deleting address from Supabase:', error);
        throw error;
      }
    } else {
      // No auth, just delete locally
      dispatch({ type: 'DELETE_ADDRESS', payload: id });
    }
  };

  const setDefaultAddress = async (id: string) => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId && state.profile && state.profile.id !== 'default-user') {
      try {
        await UserProfileService.setDefaultAddress(id, state.profile.id);
        
        // Refresh all addresses from Supabase to get latest state
        const allAddresses = await UserProfileService.getAddresses(state.profile.id);
        
        // Update profile with all addresses
        const updatedProfile = {
          ...state.profile,
          addresses: allAddresses.map(addr => ({
            id: addr.id,
            title: addr.title,
            street: addr.street,
            city: addr.city,
            zip: addr.zip_code,
            isDefault: addr.is_default,
          })),
        };
        
        dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      } catch (error) {
        console.error('Error setting default address in Supabase:', error);
        throw error;
      }
    } else {
      // No auth, just update locally
      dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: id });
    }
  };

  const syncUserWithAuth = async (userId: string, email: string) => {
    try {
      console.log('🔄 UserContext: syncUserWithAuth called for userId:', userId);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Get or create user profile in Supabase
      console.log('🔄 UserContext: Getting/creating user profile...');
      const profile = await UserProfileService.getOrCreateProfile(userId, email);
      
      if (!profile) {
        console.error('❌ UserContext: Failed to get/create user profile');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      console.log('✅ UserContext: Profile found/created:', profile.id);

      // Get addresses
      console.log('🔄 UserContext: Fetching addresses for profile:', profile.id);
      const addresses = await UserProfileService.getAddresses(profile.id);
      console.log('📋 UserContext: Found addresses:', addresses.length);

      // Convert to local format
      const userProfile: UserProfile = {
        id: profile.id,
        name: profile.name || email.split('@')[0],
        email: profile.email,
        phone: profile.phone || '',
        avatar: profile.avatar_url || undefined,
        addresses: addresses.map(addr => ({
          id: addr.id,
          title: addr.title,
          street: addr.street,
          city: addr.city,
          zip: addr.zip_code,
          isDefault: addr.is_default,
        })),
      };

      console.log('📋 UserContext: Created userProfile with', userProfile.addresses.length, 'addresses');

      dispatch({ type: 'SET_PROFILE', payload: userProfile });
      
      // Save to local storage
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      await AsyncStorage.setItem('userId', userId);
      
      console.log('✅ UserContext: syncUserWithAuth completed successfully');
    } catch (error) {
      console.error('❌ UserContext: Error syncing user with auth:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearUserData = () => {
    dispatch({ type: 'SET_PROFILE', payload: {
      id: 'default-user',
      name: '',
      email: '',
      phone: '',
      addresses: [],
    }});
    AsyncStorage.removeItem('userProfile');
    AsyncStorage.removeItem('userId');
  };

  return (
    <UserContext.Provider
      value={{
        state,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        loadUserData,
        saveUserData,
        syncUserWithAuth,
        clearUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
