import { KeystrokeProfile } from '../types';

export class KeystrokeTracker {
  private keyDownTimes: Map<string, number> = new Map();
  private dwellTimes: number[] = [];
  private flightTimes: number[] = [];
  private lastKeyTime: number = 0;
  private corrections: number = 0;
  
  startTracking() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', (e) => {
      this.keyDownTimes.set(e.key, Date.now());
      
      if (this.lastKeyTime > 0) {
        this.flightTimes.push(Date.now() - this.lastKeyTime);
      }
      this.lastKeyTime = Date.now();
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        this.corrections++;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      const downTime = this.keyDownTimes.get(e.key);
      if (downTime) {
        this.dwellTimes.push(Date.now() - downTime);
        this.keyDownTimes.delete(e.key);
      }
    });
  }
  
  getProfile(): KeystrokeProfile {
    return {
      avgDwellTime: this.average(this.dwellTimes),
      avgFlightTime: this.average(this.flightTimes),
      rhythm: this.flightTimes.slice(-10),
      errorRate: (this.corrections / this.flightTimes.length) * 100 || 0,
    };
  }
  
  compareToProfile(saved: KeystrokeProfile): number {
    const current = this.getProfile();
    const dwellDiff = Math.abs(current.avgDwellTime - saved.avgDwellTime);
    const flightDiff = Math.abs(current.avgFlightTime - saved.avgFlightTime);
    const score = 100 - (dwellDiff + flightDiff) / 2;
    return Math.max(0, Math.min(100, score));
  }
  
  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
}
