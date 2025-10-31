import { supabase } from '../supabase';

export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar_url?: string;
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

export interface CreateUserProfileData {
  phone: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface UpdateUserProfileData {
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface CreateUserAddressData {
  user_profile_id: string;
  title: string;
  street: string;
  city: string;
  zip_code: string;
  is_default?: boolean;
}

export interface UpdateUserAddressData {
  title?: string;
  street?: string;
  city?: string;
  zip_code?: string;
  is_default?: boolean;
}

export const UserService = {
  // User Profile Operations
  async createUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return profile;
  },

  async getUserProfileByPhone(phone: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
    return data;
  },

  async updateUserProfile(id: string, data: UpdateUserProfileData): Promise<UserProfile> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return profile;
  },

  async upsertUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert(data, { onConflict: 'phone' })
      .select()
      .single();

    if (error) throw error;
    return profile;
  },

  // User Address Operations
  async createUserAddress(data: CreateUserAddressData): Promise<UserAddress> {
    // If this is set as default, unset other defaults for this user
    if (data.is_default) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_profile_id', data.user_profile_id);
    }

    const { data: address, error } = await supabase
      .from('user_addresses')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return address;
  },

  async getUserAddresses(userProfileId: string): Promise<UserAddress[]> {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_profile_id', userProfileId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateUserAddress(id: string, data: UpdateUserAddressData): Promise<UserAddress> {
    // If this is set as default, unset other defaults for this user
    if (data.is_default) {
      const { data: address } = await supabase
        .from('user_addresses')
        .select('user_profile_id')
        .eq('id', id)
        .single();

      if (address) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_profile_id', address.user_profile_id)
          .neq('id', id);
      }
    }

    const { data: updatedAddress, error } = await supabase
      .from('user_addresses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedAddress;
  },

  async deleteUserAddress(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setDefaultAddress(id: string): Promise<UserAddress> {
    // Get the address to find the user_profile_id
    const { data: address, error: fetchError } = await supabase
      .from('user_addresses')
      .select('user_profile_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Unset all other defaults for this user
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_profile_id', address.user_profile_id);

    // Set this address as default
    const { data: updatedAddress, error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedAddress;
  },

  // Combined Operations
  async getUserProfileWithAddresses(phone: string): Promise<{ profile: UserProfile; addresses: UserAddress[] } | null> {
    const profile = await this.getUserProfileByPhone(phone);
    if (!profile) return null;

    const addresses = await this.getUserAddresses(profile.id);
    return { profile, addresses };
  },

  async createOrUpdateUserProfile(phone: string, profileData: UpdateUserProfileData): Promise<UserProfile> {
    const existingProfile = await this.getUserProfileByPhone(phone);
    
    if (existingProfile) {
      return await this.updateUserProfile(existingProfile.id, profileData);
    } else {
      return await this.createUserProfile({ phone, ...profileData });
    }
  }
};
