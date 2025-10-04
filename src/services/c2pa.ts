import { sha256 } from '@noble/hashes/sha256';
import { encode as encodeBase64, decode as decodeBase64 } from 'js-base64';
import { KeystoreService } from './keystore';
import { BehavioralC2PAManifest } from '../types';

export class C2PAService {
  
  // Convert base64 to Uint8Array
  private static base64ToArray(base64: string): Uint8Array {
    const binary = decodeBase64(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  
  // Convert Uint8Array to hex
  private static arrayToHex(array: Uint8Array): string {
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Hash data
  static hashData(data: string): string {
    const bytes = new TextEncoder().encode(data);
    const hash = sha256(bytes);
    return this.arrayToHex(hash);
  }
  
  // Create manifest
  static async createManifest(data: {
    payment: any;
    behavioral: any;
    passiveBio?: any;
    activeBio?: any;
  }): Promise<BehavioralC2PAManifest> {
    
    const attestation = await KeystoreService.getAttestation();
    const deviceKey = await KeystoreService.getOrCreateDeviceKey();
    
    const manifest: BehavioralC2PAManifest = {
      version: '1.0',
      claim: {
        payment: {
          amount: data.payment.amount,
          currency: 'USD',
          merchant: data.payment.merchant,
          orderId: data.payment.orderId,
        },
        behavioral: data.behavioral,
        passiveBiometrics: data.passiveBio,
        activeBiometric: data.activeBio,
        device: {
          model: attestation.deviceModel,
          os: attestation.osVersion,
          fingerprint: this.getDeviceFingerprint(),
        },
        timestamp: new Date().toISOString(),
      },
      teeAttestation: attestation,
      signature: '',
      publicKey: deviceKey.publicKey,
    };
    
    // Sign manifest
    const manifestString = JSON.stringify({
      claim: manifest.claim,
      teeAttestation: manifest.teeAttestation,
    });
    
    manifest.signature = await KeystoreService.signData(manifestString);
    
    return manifest;
  }
  
  // Verify manifest
  static verifyManifest(manifest: BehavioralC2PAManifest): {
    valid: boolean;
    checks: any;
    errors: string[];
  } {
    const errors: string[] = [];
    const checks = {
      signatureValid: false,
      teeAttestationValid: false,
      timestampValid: false,
    };
    
    // Verify signature
    const manifestString = JSON.stringify({
      claim: manifest.claim,
      teeAttestation: manifest.teeAttestation,
    });
    
    checks.signatureValid = KeystoreService.verifySignature(
      manifestString,
      manifest.signature,
      manifest.publicKey
    );
    
    if (!checks.signatureValid) {
      errors.push('Invalid C2PA signature');
    }
    
    // Verify TEE attestation
    const attestationString = JSON.stringify({
      deviceId: manifest.teeAttestation.deviceId,
      publicKey: manifest.teeAttestation.publicKey,
      timestamp: manifest.teeAttestation.timestamp,
    });
    
    checks.teeAttestationValid = KeystoreService.verifySignature(
      attestationString,
      manifest.teeAttestation.attestationSignature,
      manifest.teeAttestation.publicKey
    );
    
    if (!checks.teeAttestationValid) {
      errors.push('Invalid TEE attestation');
    }
    
    // Verify timestamp
    const claimTime = new Date(manifest.claim.timestamp).getTime();
    const age = Date.now() - claimTime;
    checks.timestampValid = age < 300000; // 5 minutes
    
    if (!checks.timestampValid) {
      errors.push('Timestamp too old');
    }
    
    return {
      valid: errors.length === 0,
      checks,
      errors,
    };
  }
  
  private static getDeviceFingerprint(): string {
    // Simple device fingerprint
    return 'device_fingerprint_' + Date.now();
  }
}
