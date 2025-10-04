import { DeviceMotion } from 'expo-sensors';
import { PassiveBiometrics } from '../types';

export class PassiveBiometricAnalyzer {
  private motionData: any[] = [];
  private touchEvents: any[] = [];
  private subscription: any = null;
  
  // Start tracking device motion
  async startTracking() {
    try {
      // Request device motion permission
      const { status } = await DeviceMotion.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Set update interval (100ms)
        DeviceMotion.setUpdateInterval(100);
        
        // Subscribe to motion updates
        this.subscription = DeviceMotion.addListener((motionData) => {
          this.motionData.push({
            ...motionData,
            timestamp: Date.now(),
          });
          
          // Keep only last 50 readings
          if (this.motionData.length > 50) {
            this.motionData.shift();
          }
        });
      }
    } catch (error) {
      console.log('Device motion not available:', error);
    }
  }
  
  // Stop tracking
  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
  
  // Track touch events (mobile only)
  trackTouchEvents() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('touchstart', (e) => {
      Array.from(e.touches).forEach((touch: any) => {
        this.touchEvents.push({
          type: 'start',
          force: touch.force || 0,
          radiusX: touch.radiusX || 0,
          radiusY: touch.radiusY || 0,
          timestamp: Date.now(),
        });
      });
    });
    
    document.addEventListener('touchend', (e) => {
      if (this.touchEvents.length > 0) {
        const lastTouch = this.touchEvents[this.touchEvents.length - 1];
        if (lastTouch.type === 'start') {
          lastTouch.duration = Date.now() - lastTouch.timestamp;
        }
      }
    });
  }
  
  // Analyze passive biometrics
  analyzePassiveBiometrics(): PassiveBiometrics {
    return {
      deviceMotion: {
        tiltPattern: this.calculateTiltPattern(),
        shakeFrequency: this.calculateShakeFrequency(),
      },
      touchDynamics: {
        pressureAverage: this.averageTouchPressure(),
        tapDuration: this.averageTapDuration(),
        fingerSize: this.averageFingerSize(),
      },
    };
  }
  
  // Compare to saved profile
  matchesProfile(savedProfile: PassiveBiometrics): number {
    const current = this.analyzePassiveBiometrics();
    let score = 100;
    
    // Compare tilt patterns
    const tiltDiff = this.compareTiltPatterns(
      savedProfile.deviceMotion.tiltPattern,
      current.deviceMotion.tiltPattern
    );
    score -= tiltDiff * 30; // 30% weight
    
    // Compare shake frequency
    const shakeDiff = Math.abs(
      savedProfile.deviceMotion.shakeFrequency - current.deviceMotion.shakeFrequency
    );
    score -= shakeDiff * 20; // 20% weight
    
    // Compare touch pressure
    const pressureDiff = Math.abs(
      savedProfile.touchDynamics.pressureAverage - current.touchDynamics.pressureAverage
    );
    score -= pressureDiff * 100 * 25; // 25% weight
    
    // Compare finger size
    const fingerDiff = Math.abs(
      savedProfile.touchDynamics.fingerSize - current.touchDynamics.fingerSize
    );
    score -= fingerDiff * 25; // 25% weight
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Save profile for future comparisons
  async saveProfile(profile: PassiveBiometrics) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('passive_bio_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save passive bio profile:', error);
    }
  }
  
  // Load saved profile
  async loadSavedProfile(): Promise<PassiveBiometrics | null> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const saved = await AsyncStorage.default.getItem('passive_bio_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }
  
  // Private helper methods
  private calculateTiltPattern(): number[] {
    return this.motionData.slice(-10).map((m) => {
      const x = m.acceleration?.x || 0;
      const y = m.acceleration?.y || 0;
      return Math.atan2(y, x);
    });
  }
  
  private calculateShakeFrequency(): number {
    const accelerations = this.motionData.map((m) => {
      const x = m.acceleration?.x || 0;
      const y = m.acceleration?.y || 0;
      const z = m.acceleration?.z || 0;
      return Math.sqrt(x * x + y * y + z * z);
    });
    
    const shakes = accelerations.filter((a) => a > 0.5);
    return this.motionData.length > 0 ? shakes.length / this.motionData.length : 0;
  }
  
  private averageTouchPressure(): number {
    const pressures = this.touchEvents.map((t) => t.force || 0);
    return pressures.length > 0
      ? pressures.reduce((a, b) => a + b, 0) / pressures.length
      : 0;
  }
  
  private averageTapDuration(): number {
    const durations = this.touchEvents
      .filter((t) => t.duration)
      .map((t) => t.duration);
    return durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
  }
  
  private averageFingerSize(): number {
    const sizes = this.touchEvents.map((t) => {
      const radiusX = t.radiusX || 0;
      const radiusY = t.radiusY || 0;
      return Math.sqrt(radiusX * radiusY);
    });
    return sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
  }
  
  private compareTiltPatterns(saved: number[], current: number[]): number {
    if (saved.length === 0 || current.length === 0) return 0;
    
    let totalDiff = 0;
    const len = Math.min(saved.length, current.length);
    
    for (let i = 0; i < len; i++) {
      totalDiff += Math.abs(saved[i] - current[i]);
    }
    
    return totalDiff / len;
  }
}
