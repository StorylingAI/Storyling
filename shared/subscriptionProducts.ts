/**
 * Stripe product and price definitions for school subscriptions
 * Shared between frontend and backend
 */

export const SUBSCRIPTION_PRODUCTS = {
  trial: {
    name: "Trial Plan",
    description: "30-day free trial for schools",
    maxStudents: 100,
    maxTeachers: 10,
    pricePerStudent: 0,
    features: [
      "Up to 100 students",
      "Up to 10 teachers",
      "Basic analytics",
      "Community vocabulary collections",
    ],
  },
  basic: {
    name: "Basic Plan",
    description: "Perfect for small schools and language centers",
    maxStudents: 500,
    maxTeachers: 25,
    pricePerStudent: 5, // $5 per student per month
    features: [
      "Up to 500 students",
      "Up to 25 teachers",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "CSV bulk upload",
    ],
  },
  premium: {
    name: "Premium Plan",
    description: "For larger institutions with advanced needs",
    maxStudents: 2000,
    maxTeachers: 100,
    pricePerStudent: 4, // $4 per student per month (volume discount)
    features: [
      "Up to 2000 students",
      "Up to 100 teachers",
      "Real-time progress tracking",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
    ],
  },
  enterprise: {
    name: "Enterprise Plan",
    description: "Custom solutions for large organizations",
    maxStudents: -1, // Unlimited
    maxTeachers: -1, // Unlimited
    pricePerStudent: 0, // Custom pricing
    features: [
      "Unlimited students and teachers",
      "Custom pricing",
      "SLA guarantees",
      "On-premise deployment options",
      "Custom development",
      "24/7 premium support",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PRODUCTS;
