import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { KeystoreService } from '../services/keystore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }: any) {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [learningStatus, setLearningStatus] = useState('');
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    loadDeviceInfo();
    loadLearningStatus();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const capabilities = await KeystoreService.getTEECapabilities();
      const attestation = await KeystoreService.getEnhancedAttestation();
      
      setDeviceInfo({
        capabilities,
        attestation,
      });
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const loadLearningStatus = async () => {
    try {
      const count = await AsyncStorage.getItem('visit_count');
      const visitNum = count ? parseInt(count) : 0;
      setVisitCount(visitNum);
      
      if (visitNum === 0) {
        setLearningStatus('🆕 First time - We\'re learning your patterns');
      } else if (visitNum < 3) {
        setLearningStatus(`📚 Learning mode (visit ${visitNum}/3)`);
      } else if (visitNum < 6) {
        setLearningStatus(`🎓 Building confidence (visit ${visitNum})`);
      } else {
        setLearningStatus('✅ Profile established - Full protection active');
      }
    } catch (error) {
      setLearningStatus('Unknown');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        🔐 PhotoProof MFA
      </Text>
      
      <Text variant="bodyLarge" style={styles.subtitle}>
        Behavioral Biometrics + C2PA + TEE
      </Text>

      {/* Learning Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Learning Status</Text>
          <Text style={styles.status}>{learningStatus}</Text>
          <Text variant="bodySmall" style={styles.hint}>
            Visits: {visitCount}
          </Text>
        </Card.Content>
      </Card>

      {/* Device Security Card */}
      {deviceInfo && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Device Security</Text>
            
            <View style={styles.statusRow}>
              <Text>Secure Enclave:</Text>
              <Chip mode="flat" style={styles.chip}>
                {deviceInfo.capabilities.hasSecureEnclave ? '✅ Yes' : '❌ No'}
              </Chip>
            </View>
            
            <View style={styles.statusRow}>
              <Text>StrongBox:</Text>
              <Chip mode="flat" style={styles.chip}>
                {deviceInfo.capabilities.hasStrongBox ? '✅ Yes' : '❌ No'}
              </Chip>
            </View>
            
            <View style={styles.statusRow}>
              <Text>Biometric Hardware:</Text>
              <Chip mode="flat" style={styles.chip}>
                {deviceInfo.capabilities.biometricHardware ? '✅ Yes' : '❌ No'}
              </Chip>
            </View>
            
            <View style={styles.statusRow}>
              <Text>Storage Level:</Text>
              <Chip mode="flat" style={styles.chip}>
                {deviceInfo.capabilities.keyStorageLevel}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 10 }}>Quick Actions</Text>
          
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Payment')}
            style={styles.actionButton}
            icon="credit-card"
          >
            Make Payment
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Verify')}
            style={styles.actionButton}
            icon="shield-check"
          >
            Verify Transaction
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.actionButton}
            icon="chart-bar"
          >
            View Analytics
          </Button>
        </Card.Content>
      </Card>

      {/* Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall">How It Works</Text>
          <Text variant="bodySmall" style={{ marginTop: 10 }}>
            • Tracks your typing and behavior patterns{'\n'}
            • Device motion and touch patterns{'\n'}
            • Only asks for FaceID when risky{'\n'}
            • Creates cryptographic proof (C2PA){'\n'}
            • Hardware-backed signatures (TEE)
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  card: {
    marginBottom: 15,
  },
  status: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  hint: {
    marginTop: 5,
    opacity: 0.6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  chip: {
    height: 28,
  },
  actionButton: {
    marginTop: 10,
  },
});