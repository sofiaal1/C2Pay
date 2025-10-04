import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { C2PAService } from '../services/c2pa';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyScreen() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerifyLastTransaction = async () => {
    setVerifying(true);
    setResult(null);

    try {
      // Load last manifest from storage
      const lastManifest = await AsyncStorage.getItem('last_manifest');
      
      if (!lastManifest) {
        Alert.alert('No Transaction', 'No recent transaction to verify');
        return;
      }

      const manifest = JSON.parse(lastManifest);
      
      // Verify the manifest
      const verification = C2PAService.verifyManifestWithTEE(manifest);
      
      setResult({
        ...verification,
        manifest,
      });

      Alert.alert(
        verification.valid ? 'Verification Passed ✓' : 'Verification Failed ✗',
        verification.valid
          ? 'Transaction is authentic and unmodified'
          : 'Issues detected: ' + verification.errors.join(', ')
      );
    } catch (error: any) {
      Alert.alert('Verification Error', error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        🔍 Verify Transaction
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 10 }}>
            Cryptographic Verification
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 20, opacity: 0.7 }}>
            Verify the authenticity and integrity of transactions using C2PA manifests and TEE attestation.
          </Text>

          <Button
            mode="contained"
            onPress={handleVerifyLastTransaction}
            loading={verifying}
            disabled={verifying}
            icon="shield-check"
          >
            Verify Last Transaction
          </Button>
        </Card.Content>
      </Card>

      {result && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <Text variant="titleLarge">
                {result.valid ? '✅ VERIFIED' : '❌ INVALID'}
              </Text>
              <Chip
                mode="flat"
                style={{
                  backgroundColor: result.valid ? '#E8F5E9' : '#FFEBEE',
                }}
                textStyle={{
                  color: result.valid ? '#2E7D32' : '#C62828',
                }}
              >
                {result.valid ? 'Authentic' : 'Tampered'}
              </Chip>
            </View>

            {/* Verification Checks */}
            <Text variant="titleSmall" style={{ marginTop: 15, marginBottom: 10 }}>
              Verification Checks:
            </Text>

            <View style={styles.checkRow}>
              <Text>C2PA Signature:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {result.checks.signatureValid ? '✅' : '❌'}
              </Text>
            </View>

            <View style={styles.checkRow}>
              <Text>TEE Attestation:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {result.checks.teeAttestationValid ? '✅' : '❌'}
              </Text>
            </View>

            <View style={styles.checkRow}>
              <Text>Timestamp:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {result.checks.timestampValid ? '✅' : '❌'}
              </Text>
            </View>

            {/* TEE Status */}
            {result.teeStatus && (
              <>
                <Text variant="titleSmall" style={{ marginTop: 15, marginBottom: 10 }}>
                  TEE Status:
                </Text>

                <View style={styles.checkRow}>
                  <Text>Hardware Backed:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {result.teeStatus.hardwareBackedClaimed ? '✅' : '❌'}
                  </Text>
                </View>

                <View style={styles.checkRow}>
                  <Text>Storage Level:</Text>
                  <Chip mode="outlined" style={{ height: 28 }}>
                    {result.teeStatus.storageLevel}
                  </Chip>
                </View>

                <View style={styles.checkRow}>
                  <Text>Key Integrity:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {result.teeStatus.keyIntegrityValid ? '✅' : '❌'}
                  </Text>
                </View>
              </>
            )}

            {/* Transaction Details */}
            {result.manifest && (
              <>
                <Text variant="titleSmall" style={{ marginTop: 15, marginBottom: 10 }}>
                  Transaction Details:
                </Text>

                <View style={styles.detailRow}>
                  <Text>Amount:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    ${result.manifest.claim.payment.amount}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text>Merchant:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {result.manifest.claim.payment.merchant}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text>Risk Score:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {result.manifest.claim.behavioral.riskScore}%
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text>Timestamp:</Text>
                  <Text style={{ fontSize: 12 }}>
                    {new Date(result.manifest.claim.timestamp).toLocaleString()}
                  </Text>
                </View>
              </>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <View style={styles.errorsContainer}>
                <Text style={{ fontWeight: 'bold', color: '#C62828', marginBottom: 5 }}>
                  ⚠️ Issues Found:
                </Text>
                {result.errors.map((error: string, i: number) => (
                  <Text key={i} style={styles.error}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall">What Gets Verified:</Text>
          <Text variant="bodySmall" style={{ marginTop: 10 }}>
            ✓ C2PA cryptographic signature{'\n'}
            ✓ TEE hardware attestation{'\n'}
            ✓ Device binding proof{'\n'}
            ✓ Timestamp validity{'\n'}
            ✓ Behavioral data integrity{'\n'}
            ✓ Biometric verification (if used)
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    marginBottom: 15,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  errorsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    marginTop: 3,
  },
});