#!/usr/bin/env node
/**
 * Setup Stripe Products and Prices for Storylingai
 * 
 * This script creates:
 * - Premium Monthly: $9.99/month
 * - Premium Annual: $99/year (save 17%)
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 100 });
    const premiumProduct = existingProducts.data.find(p => p.name === 'Storylingai Premium');

    let productId;

    if (premiumProduct) {
      console.log('✅ Found existing Premium product:', premiumProduct.id);
      productId = premiumProduct.id;
    } else {
      // Create Premium product
      const product = await stripe.products.create({
        name: 'Storylingai Premium',
        description: 'Premium subscription for Storylingai - unlimited story generation, advanced features, and priority support',
        metadata: {
          tier: 'premium',
        },
      });
      console.log('✅ Created Premium product:', product.id);
      productId = product.id;
    }

    // Check existing prices
    const existingPrices = await stripe.prices.list({ 
      product: productId,
      limit: 100,
    });

    const monthlyPrice = existingPrices.data.find(p => 
      p.recurring?.interval === 'month' && p.unit_amount === 999
    );
    const annualPrice = existingPrices.data.find(p => 
      p.recurring?.interval === 'year' && p.unit_amount === 9900
    );

    let monthlyPriceId, annualPriceId;

    // Create monthly price if doesn't exist
    if (monthlyPrice) {
      console.log('✅ Found existing monthly price:', monthlyPrice.id);
      monthlyPriceId = monthlyPrice.id;
    } else {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: 999, // $9.99
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          tier: 'premium',
          billingPeriod: 'monthly',
        },
      });
      console.log('✅ Created monthly price:', price.id, '($9.99/month)');
      monthlyPriceId = price.id;
    }

    // Create annual price if doesn't exist
    if (annualPrice) {
      console.log('✅ Found existing annual price:', annualPrice.id);
      annualPriceId = annualPrice.id;
    } else {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: 9900, // $99/year
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
        metadata: {
          tier: 'premium',
          billingPeriod: 'annual',
        },
      });
      console.log('✅ Created annual price:', price.id, '($99/year)');
      annualPriceId = price.id;
    }

    console.log('\n📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Product ID:', productId);
    console.log('Monthly Price ID:', monthlyPriceId);
    console.log('Annual Price ID:', annualPriceId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Setup complete! Add these to your environment variables:');
    console.log(`STRIPE_PRICE_PREMIUM_MONTHLY=${monthlyPriceId}`);
    console.log(`STRIPE_PRICE_PREMIUM_ANNUAL=${annualPriceId}`);

    return {
      productId,
      monthlyPriceId,
      annualPriceId,
    };
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    throw error;
  }
}

// Run the setup
setupStripeProducts()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
