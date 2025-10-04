import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './product-service';

export interface CartItem {
  product: Product;
  quantity: number;
}

export class CartService {
  
  static async getCart(): Promise<CartItem[]> {
    try {
      const cart = await AsyncStorage.getItem('shopping_cart');
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  }

  static async addToCart(product: Product): Promise<CartItem[]> {
    const cart = await this.getCart();
    const existing = cart.find(item => item.product.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }

    await AsyncStorage.setItem('shopping_cart', JSON.stringify(cart));
    return cart;
  }

  static async removeFromCart(productId: string): Promise<CartItem[]> {
    let cart = await this.getCart();
    cart = cart.filter(item => item.product.id !== productId);
    await AsyncStorage.setItem('shopping_cart', JSON.stringify(cart));
    return cart;
  }

  static async updateQuantity(productId: string, quantity: number): Promise<CartItem[]> {
    const cart = await this.getCart();
    const item = cart.find(i => i.product.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }
      item.quantity = quantity;
      await AsyncStorage.setItem('shopping_cart', JSON.stringify(cart));
    }
    
    return cart;
  }

  static async clearCart(): Promise<void> {
    await AsyncStorage.setItem('shopping_cart', '[]');
  }

  static async getCartTotal(): Promise<number> {
    const cart = await this.getCart();
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  static async getCartItemCount(): Promise<number> {
    const cart = await this.getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  }
}