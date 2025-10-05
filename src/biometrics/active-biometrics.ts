import * as LocalAuthentication from 'expo-local-authentication';
import { Camera } from 'expo-camera';
import { ActiveBiometric } from '../types';

export class ActiveBiometricService {
  
  // Main biometric verification (FaceID/TouchID)
  static async verifyBiometric(options?: {
    promptMessage?: string;
    fallbackLabel?: string;
  }): Promise<ActiveBiometric> {
    
    // Check hardware availability
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    
    if (!hasHardware) {
      return {
        method: 'none',
        verified: false,
        confidence: 0,
      };
    }
    
    // Get supported types
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    let method: 'faceId' | 'touchId' | 'none' = 'none';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      method = 'faceId';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      method = 'touchId';
    }
    
    // Authenticate
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options?.promptMessage || 'Verify your identity',
      fallbackLabel: options?.fallbackLabel || 'Use passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    
    // Debug logging
    console.log('Biometric result:', result);
    
    // Check if user cancelled or authentication failed
    // iOS error codes: 'user_cancel', 'app_cancel', 'authentication_failed', etc.
    const isVerified = result.success && !result.error;
    
    // Additional check for iOS cancellation and other failure cases
    if (result.error === 'user_cancel' || 
        result.error === 'app_cancel' || 
        result.error === 'authentication_failed' ||
        result.error === 'system_cancel' ||
        result.error === 'passcode_not_set' ||
        result.error === 'biometry_not_available' ||
        result.error === 'biometry_not_enrolled' ||
        result.error === 'biometry_lockout') {
      console.log('Biometric authentication failed or cancelled:', result.error);
      return {
        method: 'none',
        verified: false,
        confidence: 0,
      };
    }
    
    return {
      method: isVerified ? method : 'none',
      verified: isVerified,
      confidence: isVerified ? 100 : 0,
    };
  }
  
  // Selfie liveness check (backup method)
  static async verifySelfie(): Promise<{
    verified: boolean;
    isLive: boolean;
    confidence: number;
  }> {
    
    try {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        return { verified: false, isLive: false, confidence: 0 };
      }
      
      // In a real implementation, you would:
      // 1. Capture selfie
      // 2. Run liveness detection (blink, turn head)
      // 3. Face matching if previous selfie exists
      
      // For demo purposes, simulate - but don't auto-succeed
      // This should require actual user interaction
      return {
        verified: false, // Changed to false - selfie should require actual capture
        isLive: false,
        confidence: 0,
      };
      
    } catch (error) {
      console.error('Selfie verification error:', error);
      return { verified: false, isLive: false, confidence: 0 };
    }
  }
  
  // Check if biometric is available
  static async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }
  
  // Get biometric type
  static async getBiometricType(): Promise<'faceId' | 'touchId' | 'none'> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return 'none';
    
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'faceId';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'touchId';
    }
    return 'none';
  }
}
