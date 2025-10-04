import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './cart-service';
import { BehavioralC2PAManifest } from '../types';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'declined';
  riskScore: number;
  mfaUsed: boolean;
  manifest: BehavioralC2PAManifest;
  shippingAddress?: string;
}

export class OrderService {
  
  static async getOrders(): Promise<Order[]> {
    try {
      const orders = await AsyncStorage.getItem('order_history');
      return orders ? JSON.parse(orders) : [];
    } catch {
      return [];
    }
  }

  static async addOrder(order: Order): Promise<void> {
    const orders = await this.getOrders();
    orders.unshift(order);
    
    // Keep last 50 orders
    await AsyncStorage.setItem('order_history', JSON.stringify(orders.slice(0, 50)));
  }

  static async getOrderById(id: string): Promise<Order | undefined> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id);
  }
}