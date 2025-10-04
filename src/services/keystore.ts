import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { ed25519 } from '@noble/curves/ed25519';
import { encode as encodeBase64, decode as decodeBase64 } from 'js-base64';
import { DeviceKey, TEEAttestation } from '../types';

const PRIVATE_KEY_STORAGE = 'device_private_key';
const PUBLIC_KEY_STORAGE = 'device_public_key';
const DEVICE_ID_STORAGE = 'unique_device_id';

export class KeystoreService {
  
  // Helper: Array to Base64
  private static arrayToBase64(array: Uint8Array): string {
    return encodeBase64(String.fromCharCode(...array));
  }
  
  // Helper: Base64 to Array
  private static base64ToArray(base64: string): Uint8Array {
    const binary = decodeBase64(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  
  // Generate device ID
  private static async getDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_STORAGE);
    if (!deviceId) {
      deviceId = `${Device.modelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await SecureStore.setItemAsync(DEVICE_ID_STORAGE, deviceId);
    }
    return deviceId;
  }
  
  // Check biometric type
  private static async getBiometricType(): Promise<'faceId' | 'touchId' | 'none'> {
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
  
  // Check secure hardware
  private static async checkSecureHardware(): Promise<boolean> {
    if (Device.osName === 'iOS') {
      return Device.modelId?.includes('iPhone') || false;
    } else if (Device.osName === 'Android') {
      return await SecureStore.isAvailableAsync();
    }
    return false;
  }
  
  // Generate device key with attestation
  static async generateDeviceKeyWithAttestation(): Promise<{
    publicKey: string;
    attestation: TEEAttestation;
  }> {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    
    const privateKeyB64 = this.arrayToBase64(privateKey);
    const publicKeyB64 = this.arrayToBase64(publicKey);
    
    await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE, privateKeyB64, {
      requireAuthentication: false,
    });
    
    await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE, publicKeyB64);
    
    const attestation: TEEAttestation = {
      deviceId: await this.getDeviceId(),
      deviceModel: Device.modelName || 'unknown',
      osVersion: `${Device.osName} ${Device.osVersion}`,
      secureHardware: await this.checkSecureHardware(),
      biometricType: await this.getBiometricType(),
      attestationSignature: '',
      timestamp: new Date().toISOString(),
      publicKey: publicKeyB64,
    };
    
    const attestationString = JSON.stringify({
      deviceId: attestation.deviceId,
      publicKey: publicKeyB64,
      timestamp: attestation.timestamp,
    });
    
    attestation.attestationSignature = await this.signData(attestationString);
    
    return { publicKey: publicKeyB64, attestation };
  }
  
  // Get or create device key
  static async getOrCreateDeviceKey(): Promise<DeviceKey> {
    const existingPubKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
    
    if (existingPubKey) {
      return {
        publicKey: existingPubKey,
        createdAt: 'existing',
        deviceId: await this.getDeviceId(),
      };
    }
    
    const result = await this.generateDeviceKeyWithAttestation();
    return {
      publicKey: result.publicKey,
      createdAt: new Date().toISOString(),
      deviceId: result.attestation.deviceId,
    };
  }
  
  // Sign data
  static async signData(data: string): Promise<string> {
    const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
    if (!privateKeyB64) {
      throw new Error('No device key found');
    }
    
    const privateKey = this.base64ToArray(privateKeyB64);
    const message = new TextEncoder().encode(data);
    const signature = ed25519.sign(message, privateKey);
    
    return this.arrayToBase64(signature);
  }
  
  // Verify signature
  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const pubKey = this.base64ToArray(publicKey);
      const sig = this.base64ToArray(signature);
      const message = new TextEncoder().encode(data);
      
      return ed25519.verify(sig, message, pubKey);
    } catch (error) {
      return false;
    }
  }
  
  // Sign with biometric
  static async signWithBiometric(data: string): Promise<{
    signature: string;
    biometricVerified: boolean;
    method: 'faceId' | 'touchId' | 'passcode';
  }> {
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to authorize payment',
      fallbackLabel: 'Use passcode',
    });
    
    if (!auth.success) {
      throw new Error('Biometric authentication failed');
    }
    
    const signature = await this.signData(data);
    const biometricType = await this.getBiometricType();
    
    return {
      signature,
      biometricVerified: true,
      method: biometricType === 'none' ? 'passcode' : biometricType,
    };
  }
  
  // Get attestation
  static async getAttestation(): Promise<TEEAttestation> {
    const publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
    
    if (!publicKey) {
      const result = await this.generateDeviceKeyWithAttestation();
      return result.attestation;
    }
    
    const attestation: TEEAttestation = {
      deviceId: await this.getDeviceId(),
      deviceModel: Device.modelName || 'unknown',
      osVersion: `${Device.osName} ${Device.osVersion}`,
      secureHardware: await this.checkSecureHardware(),
      biometricType: await this.getBiometricType(),
      attestationSignature: '',
      timestamp: new Date().toISOString(),
      publicKey,
    };
    
    const attestationString = JSON.stringify({
      deviceId: attestation.deviceId,
      publicKey,
      timestamp: attestation.timestamp,
    });
    
    attestation.attestationSignature = await this.signData(attestationString);
    
    return attestation;
  }
}
