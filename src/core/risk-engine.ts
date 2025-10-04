import { KeystrokeTracker } from '../analytics/keystroke-tracker';
import { SessionTracker } from '../analytics/session-tracker';
import { PassiveBiometricAnalyzer } from '../biometrics/passive-biometrics';
import { ActiveBiometricService } from '../biometrics/active-biometrics';
import { C2PAService } from '../services/c2pa';
import { KeystoreService } from '../services/keystore';
import { RiskAnalysis, BehavioralC2PAManifest } from '../types';

export class RiskEngine {
  private keystrokeTracker: KeystrokeTracker;
  private sessionTracker: SessionTracker;
  private passiveBioAnalyzer: PassiveBiometricAnalyzer;
  
  constructor() {
    this.keystrokeTracker = new KeystrokeTracker();
    this.sessionTracker = new SessionTracker();
    this.passiveBioAnalyzer = new PassiveBiometricAnalyzer();
  }
  
  // Initialize all tracking
  async initialize() {
    this.keystrokeTracker.startTracking();
    this.passiveBioAnalyzer.trackTouchEvents();
    await this.passiveBioAnalyzer.startTracking();
  }
  
  // Cleanup
  cleanup() {
    this.passiveBioAnalyzer.stopTracking();
  }
  
  // Main authorization flow
  async authorizePayment(params: {
    amount: number;
    merchant: string;
    orderId: string;
    riskThreshold?: number;
  }): Promise<{
    approved: boolean;
    manifest: BehavioralC2PAManifest;
    riskAnalysis: RiskAnalysis;
    mfaTriggered: boolean;
  }> {
    
    const threshold = params.riskThreshold || 60;
    
    // Step 1: Analyze behavioral risk
    const behavioralRisk = await this.analyzeBehavioralRisk(params);
    
    // Step 2: Analyze passive biometrics (mobile only)
    const passiveBioRisk = await this.analyzePassiveBiometricRisk();
    
    // Step 3: Calculate total risk
    const totalRisk = this.calculateTotalRisk(behavioralRisk, passiveBioRisk);
    
    // Step 4: Determine if active biometric needed
    let activeBiometric = null;
    let mfaTriggered = false;
    
    if (totalRisk.totalRisk >= threshold) {
      // HIGH RISK: Require active biometric
      mfaTriggered = true;
      
      const biometricAvailable = await ActiveBiometricService.isBiometricAvailable();
      
      if (biometricAvailable) {
        activeBiometric = await ActiveBiometricService.verifyBiometric({
          promptMessage: `Authorize payment of $${params.amount} to ${params.merchant}`,
        });
        
        if (!activeBiometric.verified) {
          // Try selfie as backup
          const selfieResult = await ActiveBiometricService.verifySelfie();
          if (selfieResult.verified) {
            activeBiometric = {
              method: 'selfie',
              verified: true,
              confidence: selfieResult.confidence,
            };
          } else {
            throw new Error('Biometric verification failed');
          }
        }
      } else {
        throw new Error('Biometric verification required but not available');
      }
    }
    
    // Step 5: Create C2PA manifest with all data
    const manifest = await C2PAService.createManifest({
      payment: params,
      behavioral: {
        riskScore: totalRisk.totalRisk,
        keystroke: this.keystrokeTracker.getProfile(),
        session: this.sessionTracker.getPattern(),
      },
      passiveBio: this.passiveBioAnalyzer.analyzePassiveBiometrics(),
      activeBio: activeBiometric,
    });
    
    return {
      approved: true,
      manifest,
      riskAnalysis: totalRisk,
      mfaTriggered,
    };
  }
  
  // Analyze behavioral risk
  private async analyzeBehavioralRisk(params: any): Promise<{
    score: number;
    flags: string[];
  }> {
    const flags: string[] = [];
    let score = 0;
    
    // Check keystroke patterns
    const keystrokeProfile = this.keystrokeTracker.getProfile();
    const savedKeystroke = await this.loadSavedKeystrokeProfile();
    
    if (savedKeystroke) {
      const similarity = this.keystrokeTracker.compareToProfile(savedKeystroke);
      if (similarity < 50) {
        score += 30;
        flags.push(`Typing mismatch (${Math.round(similarity)}% match)`);
      }
    }
    
    // Check session patterns
    const sessionPattern = this.sessionTracker.getPattern();
    
    if (sessionPattern.timeOnSite < 30000) { // Less than 30 seconds
      score += 40;
      flags.push('Very short session (<30s)');
    }
    
    if (sessionPattern.searchCount === 0) {
      score += 20;
      flags.push('No search before purchase');
    }
    
    if (sessionPattern.pagesViewed < 2) {
      score += 25;
      flags.push('Minimal browsing');
    }
    
    // Check payment amount anomaly
    const savedPattern = await this.sessionTracker.loadSavedPattern();
    if (savedPattern) {
      const avgAmount = 100; // Mock typical amount
      if (params.amount > avgAmount * 3) {
        score += 30;
        flags.push(`Unusual amount ($${params.amount} vs typical $${avgAmount})`);
      }
    }
    
    return { score: Math.min(100, score), flags };
  }
  
  // Analyze passive biometric risk
  private async analyzePassiveBiometricRisk(): Promise<{
    score: number;
    flags: string[];
  }> {
    const flags: string[] = [];
    let score = 0;
    
    const savedProfile = await this.passiveBioAnalyzer.loadSavedProfile();
    
    if (savedProfile) {
      const matchScore = this.passiveBioAnalyzer.matchesProfile(savedProfile);
      
      if (matchScore < 50) {
        score = 100 - matchScore;
        flags.push(`Passive biometric mismatch (${Math.round(matchScore)}% match)`);
      }
    }
    
    return { score: Math.min(100, score), flags };
  }
  
  // Calculate total risk
  private calculateTotalRisk(
    behavioral: { score: number; flags: string[] },
    passiveBio: { score: number; flags: string[] }
  ): RiskAnalysis {
    
    // Weighted average
    const totalRisk = Math.round(
      behavioral.score * 0.6 +  // 60% weight on behavioral
      passiveBio.score * 0.4     // 40% weight on passive bio
    );
    
    const authMethods = ['behavioral_analysis'];
    if (passiveBio.score > 0) {
      authMethods.push('passive_biometrics');
    }
    
    return {
      totalRisk,
      breakdown: {
        behavioral: behavioral.score,
        passiveBio: passiveBio.score,
        session: behavioral.score, // Simplified
      },
      redFlags: [...behavioral.flags, ...passiveBio.flags],
      authMethodsUsed: authMethods,
    };
  }
  
  // Helper to load saved keystroke profile
  private async loadSavedKeystrokeProfile() {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const saved = await AsyncStorage.default.getItem('keystroke_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
  
  // Save profiles for learning
  async saveProfiles() {
    const keystrokeProfile = this.keystrokeTracker.getProfile();
    const passiveBioProfile = this.passiveBioAnalyzer.analyzePassiveBiometrics();
    const sessionPattern = this.sessionTracker.getPattern();
    
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('keystroke_profile', JSON.stringify(keystrokeProfile));
      await this.passiveBioAnalyzer.saveProfile(passiveBioProfile);
      await this.sessionTracker.savePattern();
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }
}
