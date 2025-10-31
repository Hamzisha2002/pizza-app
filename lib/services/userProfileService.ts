import { supabase } from '../supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_profile_id: string;
  title: string;
  street: string;
  city: string;
  zip_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  promotional_notifications: boolean;
  order_updates_enabled: boolean;
  dark_mode_enabled: boolean;
  preferred_payment_method: string;
  delivery_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export class UserProfileService {
  /**
   * Get or create user profile based on auth user
   */
  static async getOrCreateProfile(userId: string, email: string): Promise<UserProfile | null> {
    try {
      console.log('🔄 UserProfileService: getOrCreateProfile called for userId:', userId, 'email:', email);
      
      // First, try to get existing profile by user_id
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingProfile) {
        console.log('✅ UserProfileService: Found existing profile by user_id:', existingProfile.id);
        return existingProfile;
      }

      // If no profile found by user_id, check if profile exists by email
      const { data: profileByEmail, error: emailFetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileByEmail) {
        console.log('🔄 UserProfileService: Found profile by email, updating user_id...');
        // Update the existing profile with the new user_id
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ user_id: userId })
          .eq('id', profileByEmail.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ UserProfileService: Error updating user_id:', updateError);
          return null;
        }

        console.log('✅ UserProfileService: Updated profile user_id:', updatedProfile.id);
        return updatedProfile;
      }

      // If no profile exists at all, create one
      console.log('🔄 UserProfileService: Creating new profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          email: email,
          name: email.split('@')[0], // Default name from email
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ UserProfileService: Error creating user profile:', createError);
        return null;
      }

      // Also create default preferences
      await this.getOrCreatePreferences(userId);

      console.log('✅ UserProfileService: Created new profile:', newProfile.id);
      return newProfile;
    } catch (error) {
      console.error('❌ UserProfileService: Error in getOrCreateProfile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'avatar_url'>>
  ): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get user addresses
   */
  static async getAddresses(userProfileId: string): Promise<UserAddress[]> {
    try {
      console.log('🔄 UserProfileService: Fetching addresses for userProfileId:', userProfileId);
      
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_profile_id', userProfileId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ UserProfileService: Error fetching addresses:', error);
        return [];
      }

      console.log('✅ UserProfileService: Found addresses:', data?.length || 0);
      console.log('📋 UserProfileService: Addresses data:', data);
      
      return data || [];
    } catch (error) {
      console.error('❌ UserProfileService: Error in getAddresses:', error);
      return [];
    }
  }

  /**
   * Add new address
   */
  static async addAddress(
    userProfileId: string,
    address: Omit<UserAddress, 'id' | 'user_profile_id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: UserAddress | null; error: any | null }> {
    try {
      // If this is the first address or marked as default, update other addresses
      if (address.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_profile_id', userProfileId);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_profile_id: userProfileId,
          ...address,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update address
   */
  static async updateAddress(
    addressId: string,
    userProfileId: string,
    updates: Partial<Omit<UserAddress, 'id' | 'user_profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ error: any | null }> {
    try {
      // If setting as default, unset other defaults
      if (updates.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_profile_id', userProfileId);
      }

      const { error } = await supabase
        .from('user_addresses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', addressId)
        .eq('user_profile_id', userProfileId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Delete address
   */
  static async deleteAddress(addressId: string, userProfileId: string): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_profile_id', userProfileId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Set default address
   */
  static async setDefaultAddress(addressId: string, userProfileId: string): Promise<{ error: any | null }> {
    try {
      // Unset all defaults first
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_profile_id', userProfileId);

      // Set the new default
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_profile_id', userProfileId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get or create user preferences
   */
  static async getOrCreatePreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Try to get existing preferences
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingPrefs) {
        return existingPrefs;
      }

      // Create default preferences
      const { data: newPrefs, error: createError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating preferences:', createError);
        return null;
      }

      return newPrefs;
    } catch (error) {
      console.error('Error in getOrCreatePreferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }
}

