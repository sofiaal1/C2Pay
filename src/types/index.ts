// Device & TEE Types
export interface DeviceKey {
  publicKey: string;
  createdAt: string;
  deviceId: string;
}

export interface TEEAttestation {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  secureHardware: boolean;
  biometricType: 'faceId' | 'touchId' | 'none';
  attestationSignature: string;
  timestamp: string;
  publicKey: string;
}

// Behavioral Types
export interface KeystrokeProfile {
  avgDwellTime: number;
  avgFlightTime: number;
  rhythm: number[];
  errorRate: number;
}

export interface MouseProfile {
  avgSpeed: number;
  avgAcceleration: number;
  curvature: number;
  clickPatterns: number[];
}

export interface SessionPattern {
  timeOnSite: number;
  pagesViewed: number;
  searchCount: number;
  cartModifications: number;
}

// Biometric Types
export interface PassiveBiometrics {
  deviceMotion: {
    tiltPattern: number[];
    shakeFrequency: number;
  };
  touchDynamics: {
    pressureAverage: number;
    tapDuration: number;
    fingerSize: number;
  };
}

export interface ActiveBiometric {
  method: 'faceId' | 'touchId' | 'selfie' | 'none';
  verified: boolean;
  confidence: number;
}

// C2PA Manifest
export interface BehavioralC2PAManifest {
  version: string;
  claim: Claim; // ← single line change
  teeAttestation: TEEAttestation;
  signature: string;
  publicKey: string;
}

// Risk Analysis
export interface RiskAnalysis {
  totalRisk: number;
  breakdown: {
    behavioral: number;
    passiveBio: number;
    session: number;
  };
  redFlags: string[];
  authMethodsUsed: string[];
}

export interface EnhancedTEEAttestation extends TEEAttestation {
  teeProof: {
    capabilities: {
      hasSecureEnclave: boolean;
      hasStrongBox: boolean;
      biometricHardware: boolean;
      keyStorageLevel: 'software' | 'hardware' | 'strongbox';
    };
    integrity: {
      valid: boolean;
      stillInTEE: boolean;
      tamperDetected: boolean;
    };
    storageDetails: {
      location: string;
      extractable: boolean;
      requiresBiometric: boolean;
    };
    attestationChain: string[];
  };
  integrityCheck: {
    valid: boolean;
    stillInTEE: boolean;
    tamperDetected: boolean;
  };
}

export interface Claim {
  payment: {
    amount: number;
    currency: string;
    merchant: string;
    orderId: string;
  };
  behavioral: {
    riskScore: number;
    keystroke?: KeystrokeProfile;
    mouse?: MouseProfile;
    session?: SessionPattern;
  };
  passiveBiometrics?: PassiveBiometrics;
  activeBiometric?: ActiveBiometric;
  device: {
    model: string;
    os: string;
    fingerprint: string;
  };
  timestamp: string;

  // ADD THIS:
  teeDetails?: {
    hardwareBacked: boolean;
    storageLevel?: string;
    keyIntegrity: boolean;
    biometricCapable?: boolean;
    attestationChain?: string[];
  };
}
