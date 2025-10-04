import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { KeystoreService } from './src/services/keystore';

export default function App() {
  const [teeInfo, setTeeInfo] = useState<any>(null);

  useEffect(() => {
    async function testTEE() {
      try {
        // Test TEE capabilities
        const capabilities = await KeystoreService.getTEECapabilities();
        console.log('✅ TEE Capabilities:', capabilities);
        
        // Create hardware-backed key
        const { publicKey, teeProof } = await KeystoreService.createHardwareBackedKey();
        console.log('✅ Hardware Key Created:', publicKey.substring(0, 20) + '...');
        console.log('✅ TEE Proof:', teeProof);
        
        // Get enhanced attestation
        const attestation = await KeystoreService.getEnhancedAttestation();
        console.log('✅ Enhanced Attestation:', attestation);
        
        // Verify integrity
        const integrity = await KeystoreService.verifyKeyIntegrity();
        console.log('✅ Key Integrity:', integrity);
        
        setTeeInfo({
          capabilities,
          teeProof,
          attestation,
          integrity,
        });
      } catch (error) {
        console.error('❌ TEE Test Error:', error);
      }
    }
    testTEE();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TEE Attestation Test</Text>
      
      {teeInfo && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔐 TEE Capabilities</Text>
            <Text>Secure Enclave: {teeInfo.capabilities.hasSecureEnclave ? '✅' : '❌'}</Text>
            <Text>StrongBox: {teeInfo.capabilities.hasStrongBox ? '✅' : '❌'}</Text>
            <Text>Biometric HW: {teeInfo.capabilities.biometricHardware ? '✅' : '❌'}</Text>
            <Text>Storage Level: {teeInfo.capabilities.keyStorageLevel}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 TEE Proof</Text>
            <Text>Hardware Backed: {teeInfo.teeProof.hardwareBacked ? '✅' : '❌'}</Text>
            <Text>Extractable: {teeInfo.teeProof.extractable ? '⚠️ YES' : '✅ NO'}</Text>
            <Text>Storage: {teeInfo.teeProof.storageLevel}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Attestation Chain</Text>
            {teeInfo.attestation.teeProof.attestationChain.map((item: string, i: number) => (
              <Text key={i} style={styles.chainItem}>• {item}</Text>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✓ Key Integrity</Text>
            <Text>Valid: {teeInfo.integrity.valid ? '✅' : '❌'}</Text>
            <Text>Still in TEE: {teeInfo.integrity.stillInTEE ? '✅' : '❌'}</Text>
            <Text>Tamper Detected: {teeInfo.integrity.tamperDetected ? '⚠️ YES' : '✅ NO'}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chainItem: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginLeft: 10,
  },
});
