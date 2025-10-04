import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, IconButton, Divider } from 'react-native-paper';
import { CartService, CartItem } from '../services/cart-service';

export default function CartScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCart();
    });

    return unsubscribe;
  }, [navigation]);

  const loadCart = async () => {
    const items = await CartService.getCart();
    setCartItems(items);
    
    const cartTotal = await CartService.getCartTotal();
    setTotal(cartTotal);
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    await CartService.updateQuantity(productId, newQuantity);
    await loadCart();
  };

  const removeItem = async (productId: string) => {
    await CartService.removeFromCart(productId);
    await loadCart();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first');
      return;
    }
    navigation.navigate('Shop', { screen: 'Checkout' });
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="displaySmall">🛒</Text>
        <Text variant="headlineSmall" style={{ marginTop: 20 }}>
          Your cart is empty
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Store')}
          style={{ marginTop: 20 }}
        >
          Start Shopping
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Shopping Cart
        </Text>

        {cartItems.map((item, index) => (
          <Card key={item.product.id} style={styles.itemCard}>
            <Card.Content>
              <View style={styles.itemRow}>
                <Text style={styles.productEmoji}>{item.product.image}</Text>
                <View style={styles.itemDetails}>
                  <Text variant="titleMedium">{item.product.name}</Text>
                  <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                    {item.product.description}
                  </Text>
                  <Text variant="titleMedium" style={{ color: '#2196F3', marginTop: 5 }}>
                    ${item.product.price}
                  </Text>
                </View>
              </View>

              <View style={styles.quantityRow}>
                <View style={styles.quantityControls}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                  />
                  <Text variant="titleMedium" style={styles.quantity}>
                    {item.quantity}
                  </Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                  />
                </View>

                <Button
                  mode="text"
                  onPress={() => removeItem(item.product.id)}
                  textColor="#C62828"
                >
                  Remove
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Checkout Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">Subtotal:</Text>
            <Text variant="titleMedium">${total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Shipping:</Text>
            <Text variant="bodyMedium">FREE</Text>
          </View>
          <Divider style={{ marginVertical: 10 }} />
          <View style={styles.summaryRow}>
            <Text variant="titleLarge">Total:</Text>
            <Text variant="titleLarge" style={{ color: '#2196F3', fontWeight: 'bold' }}>
              ${total.toFixed(2)}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleCheckout}
            icon="lock"
            style={styles.checkoutButton}
            contentStyle={{ paddingVertical: 8 }}
          >
            Proceed to Secure Checkout
          </Button>

          <Text variant="bodySmall" style={styles.securityNote}>
            🔒 Protected by behavioral biometrics + TEE encryption
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 200, // Space for summary card
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  itemCard: {
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
  },
  productEmoji: {
    fontSize: 48,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  quantity: {
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  summaryCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  checkoutButton: {
    marginTop: 15,
  },
  securityNote: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 10,
  },
});