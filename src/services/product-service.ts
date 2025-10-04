export interface Product {
  id: string;
  name: string;
  price: number;
  image: string; // emoji for quick demo
  category: string;
  description: string;
  rating: number;
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    price: 999.99,
    image: '📱',
    category: 'Electronics',
    description: '128GB, Titanium Blue',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'MacBook Pro M3',
    price: 1999.99,
    image: '💻',
    category: 'Electronics',
    description: '14-inch, 16GB RAM',
    rating: 4.9,
  },
  {
    id: '3',
    name: 'AirPods Pro',
    price: 249.99,
    image: '🎧',
    category: 'Electronics',
    description: 'USB-C, Noise Cancelling',
    rating: 4.7,
  },
  {
    id: '4',
    name: 'Apple Watch Series 9',
    price: 399.99,
    image: '⌚',
    category: 'Electronics',
    description: '45mm, GPS + Cellular',
    rating: 4.6,
  },
  {
    id: '5',
    name: 'iPad Air',
    price: 599.99,
    image: '📲',
    category: 'Electronics',
    description: '11-inch, 256GB',
    rating: 4.8,
  },
  {
    id: '6',
    name: 'Sony Camera',
    price: 1499.99,
    image: '📷',
    category: 'Electronics',
    description: 'Alpha 7 IV, Full Frame',
    rating: 4.9,
  },
  {
    id: '7',
    name: 'Gaming Console',
    price: 499.99,
    image: '🎮',
    category: 'Gaming',
    description: 'PlayStation 5',
    rating: 4.8,
  },
  {
    id: '8',
    name: 'Headphones',
    price: 349.99,
    image: '🎵',
    category: 'Audio',
    description: 'Sony WH-1000XM5',
    rating: 4.7,
  },
  {
    id: '9',
    name: 'Smart TV',
    price: 899.99,
    image: '📺',
    category: 'Electronics',
    description: '55" 4K OLED',
    rating: 4.6,
  },
  {
    id: '10',
    name: 'Drone',
    price: 799.99,
    image: '🚁',
    category: 'Electronics',
    description: 'DJI Mini 4 Pro',
    rating: 4.8,
  },
];

export class ProductService {
  static getAllProducts(): Product[] {
    return PRODUCTS;
  }

  static getProductById(id: string): Product | undefined {
    return PRODUCTS.find(p => p.id === id);
  }

  static searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  static getProductsByCategory(category: string): Product[] {
    return PRODUCTS.filter(p => p.category === category);
  }
}