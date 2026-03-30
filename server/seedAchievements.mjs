import { drizzle } from "drizzle-orm/mysql2";
import { achievements } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const initialAchievements = [
  // Streak achievements
  {
    key: "streak_3",
    name: "Getting Started",
    description: "Practice for 3 days in a row",
    icon: "🔥",
    category: "streak",
    requirement: 3,
    xpReward: 50,
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    category: "streak",
    requirement: 7,
    xpReward: 100,
  },
  {
    key: "streak_30",
    name: "Monthly Master",
    description: "Keep your streak alive for 30 days",
    icon: "🏆",
    category: "streak",
    requirement: 30,
    xpReward: 500,
  },
  {
    key: "streak_100",
    name: "Centurion",
    description: "Achieve a 100-day streak",
    icon: "👑",
    category: "streak",
    requirement: 100,
    xpReward: 2000,
  },

  // Quiz achievements
  {
    key: "quiz_1",
    name: "First Quiz",
    description: "Complete your first quiz",
    icon: "📝",
    category: "quizzes",
    requirement: 1,
    xpReward: 25,
  },
  {
    key: "quiz_10",
    name: "Quiz Enthusiast",
    description: "Complete 10 quizzes",
    icon: "🎯",
    category: "quizzes",
    requirement: 10,
    xpReward: 100,
  },
  {
    key: "quiz_50",
    name: "Quiz Master",
    description: "Complete 50 quizzes",
    icon: "🌟",
    category: "quizzes",
    requirement: 50,
    xpReward: 300,
  },
  {
    key: "quiz_100",
    name: "Quiz Legend",
    description: "Complete 100 quizzes",
    icon: "💫",
    category: "quizzes",
    requirement: 100,
    xpReward: 750,
  },

  // Story achievements
  {
    key: "story_1",
    name: "First Story",
    description: "Generate your first story",
    icon: "📖",
    category: "stories",
    requirement: 1,
    xpReward: 25,
  },
  {
    key: "story_5",
    name: "Story Explorer",
    description: "Create 5 stories",
    icon: "🗺️",
    category: "stories",
    requirement: 5,
    xpReward: 75,
  },
  {
    key: "story_25",
    name: "Story Collector",
    description: "Build a library of 25 stories",
    icon: "📚",
    category: "stories",
    requirement: 25,
    xpReward: 250,
  },
  {
    key: "story_100",
    name: "Story Architect",
    description: "Create 100 unique stories",
    icon: "🏗️",
    category: "stories",
    requirement: 100,
    xpReward: 1000,
  },

  // Vocabulary achievements
  {
    key: "vocab_10",
    name: "Word Learner",
    description: "Master 10 vocabulary words",
    icon: "💡",
    category: "vocabulary",
    requirement: 10,
    xpReward: 50,
  },
  {
    key: "vocab_50",
    name: "Vocabulary Builder",
    description: "Master 50 vocabulary words",
    icon: "🧠",
    category: "vocabulary",
    requirement: 50,
    xpReward: 200,
  },
  {
    key: "vocab_100",
    name: "Word Wizard",
    description: "Master 100 vocabulary words",
    icon: "🪄",
    category: "vocabulary",
    requirement: 100,
    xpReward: 500,
  },
  {
    key: "vocab_500",
    name: "Polyglot",
    description: "Master 500 vocabulary words",
    icon: "🌍",
    category: "vocabulary",
    requirement: 500,
    xpReward: 2500,
  },

  // Special achievements
  {
    key: "perfect_quiz",
    name: "Perfect Score",
    description: "Get 100% on a quiz",
    icon: "💯",
    category: "special",
    requirement: 1,
    xpReward: 100,
  },
  {
    key: "early_bird",
    name: "Early Bird",
    description: "Complete a quiz before 8 AM",
    icon: "🌅",
    category: "special",
    requirement: 1,
    xpReward: 50,
  },
  {
    key: "night_owl",
    name: "Night Owl",
    description: "Complete a quiz after 10 PM",
    icon: "🦉",
    category: "special",
    requirement: 1,
    xpReward: 50,
  },
];

async function seedAchievements() {
  console.log("Seeding achievements...");

  for (const achievement of initialAchievements) {
    try {
      await db.insert(achievements).values(achievement);
      console.log(`✓ Added: ${achievement.name}`);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`- Skipped (exists): ${achievement.name}`);
      } else {
        console.error(`✗ Error adding ${achievement.name}:`, error.message);
      }
    }
  }

  console.log("\n✅ Achievement seeding complete!");
  process.exit(0);
}

seedAchievements().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
