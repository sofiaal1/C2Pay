import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, Divider, Chip } from 'react-native-paper';
import { RiskEngine } from '../core/risk-engine';
import { CartService } from '../services/cart-service';
import { OrderService } from '../services/order-service';
import { StripeService } from '../services/stripe-service';
import { v4 as uuidv4 } from 'uuid';

export default function CheckoutScreen({ navigation }: any) {
  const [riskEngine] = useState(new RiskEngine());
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Payment form
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/25');
  const [cvc, setCvc] = useState('123');
  const [zip, setZip] = useState('12345');
  const [name, setName] = useState('');

  useEffect(() => {
    riskEngine.initialize();
    loadCart();

    return () => {
      riskEngine.cleanup();
    };
  }, []);

  const loadCart = async () => {
    const items = await CartService.getCart();
    setCartItems(items);
    const cartTotal = await CartService.getCartTotal();
    setTotal(cartTotal);
  };

  const handlePlaceOrder = async () => {
    if (!name || name.length < 2) {
      Alert.alert('Invalid Name', 'Please enter your name');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Run YOUR fraud detection system
      console.log('🔍 Running behavioral fraud detection...');
      
      const mfaResult = await riskEngine.authorizePayment({
        amount: total,
        merchant: 'TechStore',
        orderId: uuidv4(),
        riskThreshold: 60,
      });

      console.log(`✅ Risk Score: ${mfaResult.riskAnalysis.totalRisk}%`);
      console.log(`🔐 MFA Triggered: ${mfaResult.mfaTriggered ? 'YES' : 'NO'}`);

      if (!mfaResult.approved) {
        Alert.alert('Payment Blocked', 'This transaction was flagged as high-risk.');
        setLoading(false);
        return;
      }

      // Save behavioral profile
      await riskEngine.saveProfiles();

      // STEP 2: Process payment with Stripe (demo mode)
      console.log('💳 Processing payment with Stripe...');
      
      const stripeResult = await StripeService.processPayment(total);

      if (!stripeResult.success) {
        Alert.alert('Payment Failed', 'Payment could not be processed.');
        setLoading(false);
        return;
      }

      console.log(`✅ Stripe Payment Intent: ${stripeResult.paymentIntent}`);

      // STEP 3: Create order with C2PA proof
      const order = {
        id: uuidv4(),
        items: cartItems,
        total,
        timestamp: new Date().toISOString(),
        status: 'completed' as const,
        riskScore: mfaResult.riskAnalysis.totalRisk,
        mfaUsed: mfaResult.mfaTriggered,
        manifest: mfaResult.manifest,
        shippingAddress: 'Demo Address',
        stripePaymentIntent: stripeResult.paymentIntent,
      };

      await OrderService.addOrder(order);

      // Clear cart
      await CartService.clearCart();

      // Show success with security details
      Alert.alert(
        '🎉 Order Placed!',
        `Order Total: $${total.toFixed(2)}\n\n` +
        `🛡️ Security Check:\n` +
        `Risk Score: ${mfaResult.riskAnalysis.totalRisk}%\n` +
        `${mfaResult.mfaTriggered 
          ? '✅ Biometric verification used' 
          : '✅ Auto-approved (low risk)'}\n\n` +
        `💳 Stripe Payment: ${stripeResult.paymentIntent.substring(0, 20)}...\n` +
        `📜 C2PA Receipt: ${mfaResult.manifest.signature.substring(0, 20)}...`,
        [
          {
            text: 'View Receipt',
            onPress: () => {
              navigation.navigate('Dashboard');
            },
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              navigation.navigate('Shop', {screen: 'Store'});
            },
          },
        ]
      );

    } catch (error: any) {
      Alert.alert('Checkout Error', error.message);
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Secure Checkout
      </Text>

      {/* Order Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 10 }}>Order Summary</Text>
          
          {cartItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text>{item.product.image} {item.product.name} x{item.quantity}</Text>
              <Text>${(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          
          <Divider style={{ marginVertical: 10 }} />
          
          <View style={styles.totalRow}>
            <Text variant="titleLarge">Total:</Text>
            <Text variant="titleLarge" style={{ color: '#2196F3', fontWeight: 'bold' }}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Test Card Info */}
      <Card style={styles.testCardInfo}>
        <Card.Content>
          <Text variant="titleSmall" style={{ marginBottom: 5 }}>
            ℹ️ Demo Mode - Use Test Card
          </Text>
          <Text variant="bodySmall" style={{ fontFamily: 'monospace', opacity: 0.7 }}>
            Card: 4242 4242 4242 4242{'\n'}
            Exp: 12/25  CVC: 123  ZIP: 12345
          </Text>
        </Card.Content>
      </Card>

      {/* Payment Form */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 15 }}>Payment Information</Text>

          <TextInput
            label="Cardholder Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="John Doe"
          />

          <TextInput
            label="Card Number"
            value={cardNumber}
            onChangeText={setCardNumber}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
            left={<TextInput.Icon icon="credit-card" />}
          />

          <View style={styles.row}>
            <TextInput
              label="Expiry"
              value={expiry}
              onChangeText={setExpiry}
              mode="outlined"
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="MM/YY"
            />
            <TextInput
              label="CVC"
              value={cvc}
              onChangeText={setCvc}
              mode="outlined"
              keyboardType="number-pad"
              style={[styles.input, { flex: 1 }]}
              placeholder="123"
            />
          </View>

          <TextInput
            label="ZIP Code"
            value={zip}
            onChangeText={setZip}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
            placeholder="12345"
          />
        </Card.Content>
      </Card>

      {/* Security Features */}
      <Card style={styles.securityCard}>
        <Card.Content>
          <Text variant="titleSmall" style={{ marginBottom: 10 }}>
            🛡️ Protected by PhotoProof MFA
          </Text>
          <View style={styles.securityFeatures}>
            <Chip icon="check" mode="outlined" style={styles.featureChip}>
              Behavioral Biometrics
            </Chip>
            <Chip icon="check" mode="outlined" style={styles.featureChip}>
              TEE Hardware Encryption
            </Chip>
            <Chip icon="check" mode="outlined" style={styles.featureChip}>
              C2PA Cryptographic Proof
            </Chip>
            <Chip icon="check" mode="outlined" style={styles.featureChip}>
              Adaptive MFA
            </Chip>
          </View>
          <Text variant="bodySmall" style={{ marginTop: 10, opacity: 0.7, textAlign: 'center' }}>
            Your payment is analyzed in real-time for fraud.{'\n'}
            Biometric verification only if suspicious activity detected.
          </Text>
        </Card.Content>
      </Card>

      {/* Place Order Button */}
      <Button
        mode="contained"
        onPress={handlePlaceOrder}
        loading={loading}
        disabled={loading}
        icon="shield-check"
        style={styles.placeOrderButton}
        contentStyle={{ paddingVertical: 12 }}
      >
        {loading ? 'Processing Securely...' : `Place Order - $${total.toFixed(2)}`}
      </Button>

      <Text variant="bodySmall" style={styles.disclaimer}>
        💳 Powered by Stripe (Test Mode){'\n'}
        🔒 Protected by PhotoProof MFA with C2PA + TEE{'\n'}
        No real charges will be made
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 15,
  },
  testCardInfo: {
    marginBottom: 15,
    backgroundColor: '#FFF3E0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  input: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
  },
  securityCard: {
    marginBottom: 15,
    backgroundColor: '#E8F5E9',
  },
  securityFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  placeOrderButton: {
    marginBottom: 15,
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
