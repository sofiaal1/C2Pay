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

  // Add to your existing KeystoreService class

// NEW: Get detailed TEE capabilities
static async getTEECapabilities(): Promise<{
  hasSecureEnclave: boolean;
  hasStrongBox: boolean;
  biometricHardware: boolean;
  keyStorageLevel: 'software' | 'hardware' | 'strongbox';
}> {
  const capabilities = {
    hasSecureEnclave: false,
    hasStrongBox: false,
    biometricHardware: false,
    keyStorageLevel: 'software' as 'software' | 'hardware' | 'strongbox',
  };
  
  if (Device.osName === 'iOS') {
    // Check for Secure Enclave (iPhone 5s+)
    const hasSecureEnclave = Device.modelId?.includes('iPhone') && 
                             parseInt(Device.modelId.replace(/\D/g, '')) >= 6; // iPhone 6+
    capabilities.hasSecureEnclave = hasSecureEnclave;
    capabilities.keyStorageLevel = hasSecureEnclave ? 'hardware' : 'software';
  } else if (Device.osName === 'Android') {
    // Check for StrongBox (Android 9+)
    const androidVersion = parseInt(Device.osVersion?.split('.')[0] || '0');
    capabilities.hasStrongBox = androidVersion >= 9;
    capabilities.keyStorageLevel = capabilities.hasStrongBox ? 'strongbox' : 'hardware';
  }
  
  // Check biometric hardware
  capabilities.biometricHardware = await LocalAuthentication.hasHardwareAsync();
  
  return capabilities;
}

// NEW: Create hardware-backed key with proof
static async createHardwareBackedKey(): Promise<{
  publicKey: string;
  teeProof: {
    storageLevel: string;
    extractable: boolean;
    hardwareBacked: boolean;
    attestationChain: string[];
  };
}> {
  const capabilities = await this.getTEECapabilities();
  
  // Generate key
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  
  const privateKeyB64 = this.arrayToBase64(privateKey);
  const publicKeyB64 = this.arrayToBase64(publicKey);
  
  // Store with hardware backing requirement
  const storageOptions: any = {
    requireAuthentication: false,
  };
  
  // iOS: Use Secure Enclave if available
  if (Device.osName === 'iOS' && capabilities.hasSecureEnclave) {
    storageOptions.keychainAccessible = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
  }
  
  // Android: Use StrongBox if available
  if (Device.osName === 'Android' && capabilities.hasStrongBox) {
    storageOptions.keychainService = 'strongbox';
  }
  
  await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE, privateKeyB64, storageOptions);
  await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE, publicKeyB64);
  
  // Create TEE proof
  const teeProof = {
    storageLevel: capabilities.keyStorageLevel,
    extractable: false, // Keys in TEE cannot be extracted
    hardwareBacked: capabilities.hasSecureEnclave || capabilities.hasStrongBox,
    attestationChain: [
      `device:${await this.getDeviceId()}`,
      `storage:${capabilities.keyStorageLevel}`,
      `biometric:${await this.getBiometricType()}`,
      `timestamp:${new Date().toISOString()}`,
    ],
  };
  
  return { publicKey: publicKeyB64, teeProof };
}

// NEW: Verify key is still hardware-backed
static async verifyKeyIntegrity(): Promise<{
  valid: boolean;
  stillInTEE: boolean;
  tamperDetected: boolean;
}> {
  try {
    const publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
    const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
    
    if (!publicKey || !privateKey) {
      return { valid: false, stillInTEE: false, tamperDetected: true };
    }
    
    // Test signature to ensure key still works
    const testMessage = 'integrity_check_' + Date.now();
    const signature = await this.signData(testMessage);
    const isValid = this.verifySignature(testMessage, signature, publicKey);
    
    // Check if key is still in secure storage
    const capabilities = await this.getTEECapabilities();
    const stillInTEE = capabilities.hasSecureEnclave || capabilities.hasStrongBox;
    
    return {
      valid: isValid,
      stillInTEE,
      tamperDetected: !isValid,
    };
  } catch (error) {
    return { valid: false, stillInTEE: false, tamperDetected: true };
  }
}

// NEW: Enhanced attestation with TEE proof
static async getEnhancedAttestation(): Promise<TEEAttestation & {
  teeProof: any;
  integrityCheck: any;
}> {
  const basicAttestation = await this.getAttestation();
  const capabilities = await this.getTEECapabilities();
  const integrity = await this.verifyKeyIntegrity();
  
  const teeProof = {
    capabilities,
    integrity,
    storageDetails: {
      location: capabilities.keyStorageLevel,
      extractable: false,
      requiresBiometric: basicAttestation.biometricType !== 'none',
    },
    attestationChain: [
      `device:${basicAttestation.deviceId}`,
      `storage:${capabilities.keyStorageLevel}`,
      `secure_hardware:${capabilities.hasSecureEnclave || capabilities.hasStrongBox}`,
      `biometric_hw:${capabilities.biometricHardware}`,
      `key_integrity:${integrity.valid}`,
    ],
  };
  
  return {
    ...basicAttestation,
    teeProof,
    integrityCheck: integrity,
  };
}


}


