import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { KeystoreService } from './src/services/keystore';

export default function App() {
  useEffect(() => {
    async function testKeystore() {
      try {
        const key = await KeystoreService.getOrCreateDeviceKey();
        console.log('✅ Device Key:', key.publicKey.substring(0, 20) + '...');
        
        const signature = await KeystoreService.signData('test message');
        console.log('✅ Signature:', signature.substring(0, 20) + '...');
        
        const isValid = KeystoreService.verifySignature('test message', signature, key.publicKey);
        console.log('✅ Verification:', isValid);
      } catch (error) {
        console.error('❌ Error:', error);
      }
    }
    testKeystore();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Check console for keystore test results</Text>
    </View>
  );
}
