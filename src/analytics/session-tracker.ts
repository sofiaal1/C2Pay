import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionPattern } from '../types';

export class SessionTracker {
  private sessionStart = Date.now();
  private pagesViewed = 0;
  private searchCount = 0;
  private cartMods = 0;
  
  recordPageView() {
    this.pagesViewed++;
  }
  
  recordSearch() {
    this.searchCount++;
  }
  
  recordCartModification() {
    this.cartMods++;
  }
  
  getPattern(): SessionPattern {
    return {
      timeOnSite: Date.now() - this.sessionStart,
      pagesViewed: this.pagesViewed,
      searchCount: this.searchCount,
      cartModifications: this.cartMods,
    };
  }
  
  async savePattern() {
    const pattern = this.getPattern();
    await AsyncStorage.setItem('session_pattern', JSON.stringify(pattern));
  }
  
  async loadSavedPattern(): Promise<SessionPattern | null> {
    const saved = await AsyncStorage.getItem('session_pattern');
    return saved ? JSON.parse(saved) : null;
  }
}
