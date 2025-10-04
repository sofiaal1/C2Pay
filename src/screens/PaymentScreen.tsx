import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, SegmentedButtons, Chip, ActivityIndicator } from 'react-native-paper';
import { RiskEngine } from '../core/risk-engine';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentScreen() {
  const [riskEngine] = useState(new RiskEngine());
  const [amount, setAmount] = useState('499.99');
  const [merchant, setMerchant] = useState('TechStore');
  const [orderId, setOrderId] = useState('');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    riskEngine.initialize();
    setOrderId('ORDER-' + Date.now());

    return () => {
      riskEngine.cleanup();
    };
  }, []);

  const getRiskThreshold = () => {
    switch (riskLevel) {
      case 'low': return 70;
      case 'medium': return 50;
      case 'high': return 30;
    }
  };

const handlePayment = async () => {
  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount');
    return;
  }

  setLoading(true);
  setResult(null);

  try {
    const paymentResult = await riskEngine.authorizePayment({
      amount: parseFloat(amount),
      merchant,
      orderId,
      riskThreshold: getRiskThreshold(),
    });

    setResult(paymentResult);

    // Save manifest for verification
    await AsyncStorage.setItem(
      'last_manifest',
      JSON.stringify(paymentResult.manifest)
    );

    // Save to payment history
    const history = await AsyncStorage.getItem('payment_history');
    const payments = history ? JSON.parse(history) : [];
    payments.unshift({
      manifest: paymentResult.manifest,
      timestamp: new Date().toISOString(),
      amount: parseFloat(amount),
      merchant,
    });
    await AsyncStorage.setItem(
      'payment_history', 
      JSON.stringify(payments.slice(0, 50))
    );

    // Save profiles for learning
    await riskEngine.saveProfiles();

    Alert.alert(
      'Payment Authorized ✓',
      `Amount: $${amount}\n` +
      `Risk Score: ${paymentResult.riskAnalysis.totalRisk}%\n` +
      `MFA: ${paymentResult.mfaTriggered ? 'Required & Verified' : 'Not needed'}\n` +
      `Methods: ${paymentResult.riskAnalysis.authMethodsUsed.join(', ')}`
    );

    // Reset for next payment
    setOrderId('ORDER-' + Date.now());
  } catch (error: any) {
    Alert.alert('Payment Failed', error.message);
    setResult(null);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        💳 Make Payment
      </Text>

      {/* Payment Details Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 15 }}>Payment Details</Text>

          <TextInput
            label="Amount ($)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="currency-usd" />}
            style={{ marginBottom: 15 }}
          />

          <TextInput
            label="Merchant"
            value={merchant}
            onChangeText={setMerchant}
            mode="outlined"
            left={<TextInput.Icon icon="store" />}
            style={{ marginBottom: 15 }}
          />

          <TextInput
            label="Order ID"
            value={orderId}
            editable={false}
            mode="outlined"
            left={<TextInput.Icon icon="tag" />}
            style={{ marginBottom: 15 }}
          />
        </Card.Content>
      </Card>

      {/* Risk Simulation Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 10 }}>Simulate Risk Level</Text>
          <Text variant="bodySmall" style={{ marginBottom: 15, opacity: 0.7 }}>
            Choose how sensitive the fraud detection should be
          </Text>

          <SegmentedButtons
            value={riskLevel}
            onValueChange={(value: any) => setRiskLevel(value)}
            buttons={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />

          <Text variant="bodySmall" style={{ marginTop: 10, opacity: 0.6 }}>
            {riskLevel === 'low' && 'Most transactions auto-approve'}
            {riskLevel === 'medium' && 'Balanced - some require MFA'}
            {riskLevel === 'high' && 'Strict - most require biometric'}
          </Text>
        </Card.Content>
      </Card>

      {/* Process Payment Button */}
      <Button
        mode="contained"
        onPress={handlePayment}
        loading={loading}
        disabled={loading}
        icon="credit-card-check"
        style={styles.payButton}
        contentStyle={{ paddingVertical: 8 }}
      >
        {loading ? 'Processing...' : 'Process Payment'}
      </Button>

      {/* Result Card */}
      {result && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <Text variant="titleLarge">
                {result.approved ? '✅ Approved' : '❌ Declined'}
              </Text>
              <Chip
                mode="flat"
                style={[
                  styles.riskChip,
                  {
                    backgroundColor:
                      result.riskAnalysis.totalRisk > 70
                        ? '#FFEBEE'
                        : result.riskAnalysis.totalRisk > 40
                        ? '#FFF3E0'
                        : '#E8F5E9',
                  },
                ]}
                textStyle={{
                  color:
                    result.riskAnalysis.totalRisk > 70
                      ? '#C62828'
                      : result.riskAnalysis.totalRisk > 40
                      ? '#E65100'
                      : '#2E7D32',
                }}
              >
                Risk: {result.riskAnalysis.totalRisk}%
              </Chip>
            </View>

            <View style={styles.resultRow}>
              <Text>MFA Triggered:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {result.mfaTriggered ? '⚠️ YES' : '✓ NO'}
              </Text>
            </View>

            {result.manifest.claim.activeBiometric && (
              <View style={styles.resultRow}>
                <Text>Biometric Method:</Text>
                <Text style={{ fontWeight: 'bold' }}>
                  {result.manifest.claim.activeBiometric.method === 'faceId' && '👤 FaceID'}
                  {result.manifest.claim.activeBiometric.method === 'touchId' && '👆 TouchID'}
                  {result.manifest.claim.activeBiometric.method === 'selfie' && '🤳 Selfie'}
                </Text>
              </View>
            )}

            <View style={styles.resultRow}>
              <Text>Auth Methods:</Text>
              <View>
                {result.riskAnalysis.authMethodsUsed.map((method: string, i: number) => (
                  <Chip key={i} mode="outlined" style={{ marginTop: 5 }}>
                    {method}
                  </Chip>
                ))}
              </View>
            </View>

            {result.riskAnalysis.redFlags.length > 0 && (
              <View style={styles.flagsContainer}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🚩 Risk Factors:</Text>
                {result.riskAnalysis.redFlags.map((flag: string, i: number) => (
                  <Text key={i} style={styles.flag}>
                    • {flag}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.resultRow}>
              <Text>C2PA Signature:</Text>
              <Text style={styles.signature}>
                {result.manifest.signature.substring(0, 20)}...
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text>TEE Hardware:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {result.manifest.claim.teeDetails?.hardwareBacked ? '🔒 Yes' : '⚠️ No'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Analyzing behavior patterns...</Text>
        </View>
      )}
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
  payButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    marginTop: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  riskChip: {
    height: 32,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 5,
  },
  flagsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  flag: {
    color: '#E65100',
    fontSize: 13,
    marginTop: 3,
  },
  signature: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#1976D2',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});