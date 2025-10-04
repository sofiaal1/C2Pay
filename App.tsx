import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens 
import HomeScreen from './src/screens/HomeScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import StoreScreen from './src/screens/StoreScreen';
import CartScreen from './src/screens/CartScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ShopStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Store' component={StoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name='Cart' component={CartScreen} />
      <Stack.Screen name='Checkout' component={CheckoutScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Payment') {
                iconName = focused ? 'card' : 'card-outline';
              } else if (route.name === 'Verify') {
                iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
              } else if (route.name === 'Dashboard') {
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Home' }}
          />
          <Tab.Screen 
            name="Payment" 
            component={PaymentScreen}
            options={{ title: 'Pay' }}
          />
          <Tab.Screen 
            name="Verify" 
            component={VerifyScreen}
            options={{ title: 'Verify' }}
          />
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ title: 'Analytics' }}
          />
          <Tab.Screen 
            name="Store" 
            component={StoreScreen}
            options={{ title: 'Shop' }}
          />
          <Tab.Screen 
            name="Cart" 
            component={CartScreen}
            options={{ title: 'Cart' }}
          />
          <Tab.Screen name="Shop" component={ShopStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}