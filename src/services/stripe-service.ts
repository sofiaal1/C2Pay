import { Alert } from 'react-native';

const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY;

export class StripeService {
  
  // Simulate payment (demo mode)
  static async processPayment(amount: number): Promise<{
    success: boolean;
    paymentIntent: string;
  }> {
    
    // In demo, we simulate Stripe API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          paymentIntent: `pi_test_${Date.now()}`,
        });
      }, 1000); // Simulate network delay
    });
  }

  // Demo: Show test card info
  static getTestCardInfo(): string {
    return `Use test card:
      Card: 4242 4242 4242 4242
      Exp: 12/25
      CVC: 123
      ZIP: 12345`;
  }
}
