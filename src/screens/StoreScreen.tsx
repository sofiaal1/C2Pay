import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, Badge, Button, IconButton } from 'react-native-paper';
import { ProductService, Product } from '../services/product-service';
import { CartService } from '../services/cart-service';

export default function StoreScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadProducts();
    loadCartCount();
  }, []);

  const loadProducts = () => {
    if (selectedCategory === 'All') {
      setProducts(ProductService.getAllProducts());
    } else {
      setProducts(ProductService.getProductsByCategory(selectedCategory));
    }
  };

  const loadCartCount = async () => {
    const count = await CartService.getCartItemCount();
    setCartCount(count);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setProducts(ProductService.searchProducts(query));
    } else {
      loadProducts();
    }
  };

  const handleAddToCart = async (product: Product) => {
    await CartService.addToCart(product);
    await loadCartCount();
    Alert.alert('Added to Cart', `${product.name} added to your cart`);
  };

  const categories = ['All', 'Electronics', 'Gaming', 'Audio'];

  return (
    <View style={styles.container}>
      {/* Header with Cart */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          🛍️ TechStore
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <View>
            <IconButton icon="cart" size={28} />
            {cartCount > 0 && (
              <Badge style={styles.badge}>{cartCount}</Badge>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchBar}
      />

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map(cat => (
          <Chip
            key={cat}
            mode={selectedCategory === cat ? 'flat' : 'outlined'}
            selected={selectedCategory === cat}
            onPress={() => {
              setSelectedCategory(cat);
              setSearchQuery('');
              setTimeout(loadProducts, 0);
            }}
            style={styles.categoryChip}
          >
            {cat}
          </Chip>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <ScrollView contentContainerStyle={styles.productsContainer}>
        <View style={styles.productsGrid}>
          {products.map(product => (
            <Card key={product.id} style={styles.productCard}>
              <Card.Content>
                <Text style={styles.productImage}>{product.image}</Text>
                <Text variant="titleMedium" numberOfLines={2} style={styles.productName}>
                  {product.name}
                </Text>
                <Text variant="bodySmall" numberOfLines={2} style={styles.productDesc}>
                  {product.description}
                </Text>
                <View style={styles.productFooter}>
                  <Text variant="titleLarge" style={styles.price}>
                    ${product.price}
                  </Text>
                  <Text variant="bodySmall" style={styles.rating}>
                    ⭐ {product.rating}
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => handleAddToCart(product)}
                  icon="cart-plus"
                  style={{ flex: 1 }}
                >
                  Add to Cart
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFF',
  },
  title: {
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  searchBar: {
    margin: 15,
    marginTop: 0,
  },
  categories: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  categoryChip: {
    marginRight: 8,
  },
  productsContainer: {
    padding: 15,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 15,
  },
  productImage: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: 10,
  },
  productName: {
    marginTop: 5,
    height: 45,
  },
  productDesc: {
    opacity: 0.6,
    marginTop: 5,
    height: 32,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  rating: {
    opacity: 0.7,
  },
});