import { Image } from 'react-native';

export class ImageService {
  private static preloadedImages = new Set<string>();

  // Preload images for better performance
  static async preloadImages(imageUrls: string[]): Promise<void> {
    const preloadPromises = imageUrls.map(url => {
      if (!this.preloadedImages.has(url)) {
        return new Promise<void>((resolve, reject) => {
          Image.prefetch(url)
            .then(() => {
              this.preloadedImages.add(url);
              resolve();
            })
            .catch((error) => {
              console.log('Failed to preload image:', url, error);
              resolve(); // Don't fail the entire preload process
            });
        });
      }
      return Promise.resolve();
    });

    await Promise.all(preloadPromises);
  }

  // Clear preloaded images cache
  static clearCache(): void {
    this.preloadedImages.clear();
  }

  // Check if image is preloaded
  static isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  // Get optimized image URL (you can add image resizing service here)
  static getOptimizedImageUrl(originalUrl: string, width?: number, height?: number): string {
    // If you have an image optimization service, you can add it here
    // For now, return the original URL
    return originalUrl;
  }
}
