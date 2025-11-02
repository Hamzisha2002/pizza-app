import { supabase, Category, MenuItem, MenuItemSize, Deal } from '../supabase';
import { ImageService } from './imageService';

// Simple in-memory cache
class MenuCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }
}

export class MenuService {
  // Fetch all categories with caching using optimized function
  static async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories';
    const cached = MenuCache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .rpc('get_categories');

      if (error) throw error;
      const categories = data || [];
      MenuCache.set(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Fetch menu items with category and sizes
  static async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    try {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(*),
          sizes:menu_item_sizes(id, size_name, price, is_available)
        `)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      const items = data || [];
      
      // Preload images for better performance
      const imageUrls = items
        .map(item => item.image_url)
        .filter(url => url && url.trim() !== '');
      
      if (imageUrls.length > 0) {
        ImageService.preloadImages(imageUrls).catch(error => {
          console.log('Failed to preload some images:', error);
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  // Fetch popular menu items using optimized database function
  static async getPopularItems(): Promise<MenuItem[]> {
    const cacheKey = 'popular_items';
    const cached = MenuCache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .rpc('get_popular_menu_items');

      if (error) throw error;
      const items = data || [];
      
      // Preload images for better performance
      const imageUrls = items
        .map(item => item.image_url)
        .filter(url => url && url.trim() !== '');
      
      if (imageUrls.length > 0) {
        ImageService.preloadImages(imageUrls).catch(error => {
          console.log('Failed to preload some images:', error);
        });
      }
      
      MenuCache.set(cacheKey, items);
      return items;
    } catch (error) {
      console.error('Error fetching popular items:', error);
      return [];
    }
  }

  // Fetch deals
  static async getDeals(): Promise<Deal[]> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  // Search menu items using optimized function
  static async searchMenuItems(searchTerm: string): Promise<MenuItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_menu_items', { search_term: searchTerm });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching menu items:', error);
      return [];
    }
  }

  // Get menu item by ID
  static async getMenuItemById(id: string): Promise<MenuItem | null> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(*),
          sizes:menu_item_sizes(id, size_name, price, is_available)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching menu item:', error);
      return null;
    }
  }

  // Clear all cached data
  static clearCache() {
    MenuCache.clear();
  }

  // Preload essential data for faster app startup
  static async preloadData() {
    try {
      // Load essential data in parallel
      await Promise.all([
        this.getCategories(),
        this.getPopularItems()
      ]);
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }
}
