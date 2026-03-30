import { drizzle } from "drizzle-orm/mysql2";
import { collectionCategories } from "../drizzle/schema.js";

const INITIAL_CATEGORIES = [
  {
    name: "Business",
    slug: "business",
    description: "Professional vocabulary and business communication",
    icon: "💼",
    color: "#3B82F6",
    displayOrder: 1,
  },
  {
    name: "Travel",
    slug: "travel",
    description: "Essential phrases and vocabulary for travelers",
    icon: "✈️",
    color: "#10B981",
    displayOrder: 2,
  },
  {
    name: "Academic",
    slug: "academic",
    description: "University-level vocabulary and academic terms",
    icon: "🎓",
    color: "#8B5CF6",
    displayOrder: 3,
  },
  {
    name: "Daily Life",
    slug: "daily-life",
    description: "Everyday conversations and common expressions",
    icon: "🏠",
    color: "#F59E0B",
    displayOrder: 4,
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Tech industry vocabulary and digital communication",
    icon: "💻",
    color: "#06B6D4",
    displayOrder: 5,
  },
  {
    name: "Food & Dining",
    slug: "food-dining",
    description: "Restaurant vocabulary and food-related terms",
    icon: "🍽️",
    color: "#EF4444",
    displayOrder: 6,
  },
  {
    name: "Health & Fitness",
    slug: "health-fitness",
    description: "Medical vocabulary and wellness terms",
    icon: "🏥",
    color: "#14B8A6",
    displayOrder: 7,
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    description: "Movies, music, and cultural vocabulary",
    icon: "🎬",
    color: "#EC4899",
    displayOrder: 8,
  },
  {
    name: "Shopping",
    slug: "shopping",
    description: "Retail vocabulary and shopping phrases",
    icon: "🛍️",
    color: "#F97316",
    displayOrder: 9,
  },
  {
    name: "Nature & Environment",
    slug: "nature-environment",
    description: "Environmental and outdoor vocabulary",
    icon: "🌿",
    color: "#22C55E",
    displayOrder: 10,
  },
];

async function seedCategories() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding collection categories...");

  try {
    for (const category of INITIAL_CATEGORIES) {
      await db.insert(collectionCategories).values(category).onDuplicateKeyUpdate({
        set: {
          description: category.description,
          icon: category.icon,
          color: category.color,
          displayOrder: category.displayOrder,
        },
      });
      console.log(`✓ Seeded category: ${category.name}`);
    }

    console.log("\n✅ All categories seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedCategories();
