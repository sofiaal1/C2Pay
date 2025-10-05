  import React, { useEffect, useState } from 'react';
  import { View, ScrollView, StyleSheet } from 'react-native';
  import { Text, Card, Button, Chip } from 'react-native-paper';
  import { KeystoreService } from '../services/keystore';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  export default function HomeScreen({ navigation }: any) {
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [visitCount, setVisitCount] = useState(0);

    useEffect(() => {
      loadDeviceInfo();
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

    
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>
          C2Pay
        </Text>
        
        <Text variant="bodyLarge" style={styles.subtitle}>
          A Payment Simulation for the C2Pay SDK
        </Text>

        

        {/* Device Security Card */}
        {deviceInfo && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Device Security</Text>
              
              <View style={styles.statusRow}>
                <View style={styles.labelContainer}>
                  <Text>Secure Enclave:</Text>
                  <Text style={styles.caption}>Secure chip for encryption/biometrics for iOS users</Text>
                </View>
                <Chip mode="flat" style={styles.chip}>
                    {deviceInfo.capabilities.hasSecureEnclave ? 'Yes' : 'No'}
                </Chip>
              </View>
              
              <View style={styles.statusRow}>
                <View style={styles.labelContainer}>
                  <Text>StrongBox:</Text>
                  <Text style={styles.caption}>Security module for Android users</Text>
                </View>
                <Chip mode="flat" style={styles.chip}>
                  {deviceInfo.capabilities.hasStrongBox ? 'Yes' : 'No'}
                </Chip>
              </View>
              
              <View style={styles.statusRow}>
                <View style={styles.labelContainer}>
                  <Text>Biometric Hardware:</Text>
                  <Text style={styles.caption}>Face ID, Touch ID, or fingerprint sensor</Text>
                </View>
                <Chip mode="flat" style={styles.chip}>
                  {deviceInfo.capabilities.biometricHardware ? 'Yes' : 'No'}
                </Chip>
              </View>
              
              <View style={styles.statusRow}>
                <View style={styles.labelContainer}>
                  <Text>Storage Level:</Text>
                  <Text style={styles.caption}>Security storage tier</Text>
                </View>
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
    labelContainer: {
      flex: 1,
      marginRight: 10,
    },
    caption: {
      fontSize: 12,
      opacity: 0.6,
      marginTop: 2,
    },
    chip: {
      height: 40,
      justifyContent: 'center',
      paddingHorizontal: 12,
      minWidth: 80, 
      alignItems: 'center',
      textAlign: 'center',
    },
    actionButton: {
      marginTop: 10,
    },
  });