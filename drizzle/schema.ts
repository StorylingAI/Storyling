import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  json,
  float,
  decimal,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatar_url"),
  passwordHash: varchar("password_hash", { length: 255 }),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "teacher", "org_admin"])
    .default("user")
    .notNull(),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default(
    "en"
  ),
  preferredTranslationLanguage: varchar("preferred_translation_language", {
    length: 10,
  }).default("en"),
  // Individual subscription fields
  subscriptionTier: mysqlEnum("subscription_tier", [
    "free",
    "premium",
    "premium_plus",
  ])
    .default("free")
    .notNull(), // premium_plus kept for backward compat, treated as premium
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  premiumOnboardingCompleted: boolean("premium_onboarding_completed")
    .default(false)
    .notNull(),
  // Weekly goal tracking
  weeklyGoal: int("weekly_goal").default(5).notNull(), // Number of stories to create per week
  weeklyProgress: int("weekly_progress").default(0).notNull(), // Current week's story count
  weekStartDate: timestamp("week_start_date").defaultNow().notNull(), // When current week started
  weeklyGoalEmailSent: boolean("weekly_goal_email_sent")
    .default(false)
    .notNull(), // Track if congratulations email was sent this week
  weeklyGoalStreak: int("weekly_goal_streak").default(0).notNull(), // Number of consecutive weeks goal was reached
  lastWeekGoalReached: boolean("last_week_goal_reached")
    .default(false)
    .notNull(), // Whether last week's goal was reached
  bonusStoryCredits: int("bonus_story_credits").default(3).notNull(), // Starter pack: 3 free stories on signup
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  timezone: varchar("timezone", { length: 64 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Daily usage tracking for free tier limits.
 * Server-side source of truth — survives server restarts.
 * Composite unique on (userId, dateKey) for upsert.
 */
export const dailyUsageTracking = mysqlTable("daily_usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  dateKey: varchar("date_key", { length: 10 }).notNull(), // "2026-03-07"
  lookupCount: int("lookup_count").default(0).notNull(),
  vocabSaveCount: int("vocab_save_count").default(0).notNull(),
  storyCount: int("story_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("daily_usage_tracking_user_date_unique").on(table.userId, table.dateKey),
]);
export type DailyUsageTracking = typeof dailyUsageTracking.$inferSelect;

/**
 * User statistics for gamification
 */
export const userStats = mysqlTable("user_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  currentStreak: int("current_streak").default(0).notNull(),
  longestStreak: int("longest_streak").default(0).notNull(),
  lastActivityDate: date("last_activity_date"),
  totalXp: int("total_xp").default(0).notNull(),
  coins: int("coins").default(0).notNull(),
  level: int("level").default(1).notNull(),
  storiesCompleted: int("stories_completed").default(0).notNull(),
  quizzesCompleted: int("quizzes_completed").default(0).notNull(),
  wordsLearned: int("words_learned").default(0).notNull(),
  masterySuggestionsSnoozeUntil: timestamp("mastery_suggestions_snooze_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;

/**
 * Reward claims for dashboard challenges.
 * `periodKey` scopes idempotency per day/week depending on the challenge.
 */
export const challengeRewardClaims = mysqlTable("challenge_reward_claims", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  challengeKey: varchar("challenge_key", { length: 64 }).notNull(),
  periodKey: varchar("period_key", { length: 32 }).notNull(),
  xpAwarded: int("xp_awarded").default(0).notNull(),
  coinsAwarded: int("coins_awarded").default(0).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export type ChallengeRewardClaim = typeof challengeRewardClaims.$inferSelect;
export type InsertChallengeRewardClaim =
  typeof challengeRewardClaims.$inferInsert;

/**
 * Achievement definitions
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Emoji or icon name
  category: mysqlEnum("category", [
    "streak",
    "stories",
    "quizzes",
    "vocabulary",
    "collections",
    "special",
  ]).notNull(),
  requirement: int("requirement").notNull(), // e.g., 7 for "7-day streak"
  xpReward: int("xp_reward").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * User unlocked achievements
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  achievementId: int("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Cookie consent preferences for GDPR compliance
 */
export const cookiePreferences = mysqlTable("cookie_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  necessary: boolean("necessary").default(true).notNull(), // Always true, required for basic functionality
  analytics: boolean("analytics").default(false).notNull(),
  marketing: boolean("marketing").default(false).notNull(),
  preferences: boolean("preferences").default(false).notNull(),
  consentDate: timestamp("consent_date").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CookiePreferences = typeof cookiePreferences.$inferSelect;
export type InsertCookiePreferences = typeof cookiePreferences.$inferInsert;

/**
 * Tutorial challenges for interactive onboarding
 */
export const tutorialChallenges = mysqlTable("tutorial_challenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  challengeId: varchar("challenge_id", { length: 100 }).notNull(), // create_story, add_vocabulary, play_content, take_quiz, explore_progress
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TutorialChallenge = typeof tutorialChallenges.$inferSelect;
export type InsertTutorialChallenge = typeof tutorialChallenges.$inferInsert;

/**
 * Vocabulary lists submitted by users
 */
export const vocabularyLists = mysqlTable("vocabulary_lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2
  words: text("words").notNull(), // Comma-separated vocabulary words
  topicPrompt: text("topic_prompt"), // Optional topic prompt
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Public vocabulary collections for sharing and SEO
 */
export const vocabularyCollections = mysqlTable("vocabulary_collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // Creator
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // SEO-friendly URL: chinese-business-hsk4
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2, HSK 1-6
  category: varchar("category", { length: 100 }), // Business, Travel, Academic, Daily Life, etc.
  tags: text("tags"), // Comma-separated tags for search
  words: json("words").notNull(), // Array of {word, translation, example?}
  wordCount: int("word_count").default(0).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(), // Admin curated
  viewCount: int("view_count").default(0).notNull(),
  cloneCount: int("clone_count").default(0).notNull(), // How many times cloned
  likeCount: int("like_count").default(0).notNull(),
  metaTitle: varchar("meta_title", { length: 255 }), // SEO meta title
  metaDescription: text("meta_description"), // SEO meta description
  metaKeywords: text("meta_keywords"), // SEO keywords
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VocabularyCollection = typeof vocabularyCollections.$inferSelect;
export type InsertVocabularyCollection =
  typeof vocabularyCollections.$inferInsert;

/**
 * User likes on vocabulary collections
 */
export const vocabularyCollectionLikes = mysqlTable(
  "vocabulary_collection_likes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    collectionId: int("collection_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export type VocabularyCollectionLike =
  typeof vocabularyCollectionLikes.$inferSelect;
export type InsertVocabularyCollectionLike =
  typeof vocabularyCollectionLikes.$inferInsert;

export type VocabularyList = typeof vocabularyLists.$inferSelect;
export type InsertVocabularyList = typeof vocabularyLists.$inferInsert;

/**
 * Generated content (stories, podcasts, films)
 */
export const generatedContent = mysqlTable("generated_content", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  vocabularyListId: int("vocabulary_list_id").notNull(),
  mode: mysqlEnum("mode", ["podcast", "film"]).notNull(),
  theme: varchar("theme", { length: 100 }).notNull(), // Comedy, Romance, Adventure, etc.
  title: varchar("title", { length: 200 }), // Story title for display in target language
  titleTranslation: varchar("title_translation", { length: 200 }), // Story title translated to user's preferred language
  difficultyLevel: varchar("difficulty_level", { length: 10 }), // HSK 1-6 for Chinese, CEFR A1-C2 for others
  thumbnailUrl: text("thumbnail_url"), // S3 URL for story thumbnail image
  thumbnailStyle: mysqlEnum("thumbnail_style", [
    "realistic",
    "illustrated",
    "minimalist",
    "pixar",
  ]).default("pixar"), // Thumbnail visual style
  voiceType: varchar("voice_type", { length: 100 }), // For podcast mode
  narratorGender: mysqlEnum("narrator_gender", ["male", "female"]), // For podcast mode
  cinematicStyle: varchar("cinematic_style", { length: 100 }), // For film mode
  musicVolume: int("music_volume").default(20), // Background music volume (0-100)
  selectedMusicTrack: varchar("selected_music_track", { length: 100 }), // Selected music track filename
  storyText: text("story_text").notNull(), // The generated story text
  lineTranslations: json("line_translations"), // Line-by-line translations with pinyin
  vocabularyTranslations: json("vocabulary_translations"), // Vocabulary word translations
  audioUrl: text("audio_url"), // S3 URL for podcast audio
  audioAlignment: json("audio_alignment"), // ElevenLabs character-level timing data {characters, character_start_times_seconds, character_end_times_seconds}
  videoUrl: text("video_url"), // S3 URL for film video
  transcript: text("transcript"), // Full transcript with timestamps
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"])
    .default("pending")
    .notNull(),
  progress: int("progress").default(0).notNull(), // 0-100 percentage
  progressStage: varchar("progress_stage", { length: 100 }), // Current generation stage
  retryCount: int("retry_count").default(0).notNull(),
  lastRetryAt: timestamp("last_retry_at"),
  failureReason: text("failure_reason"),
  isPublic: boolean("is_public").default(false).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  playCount: int("play_count").default(0).notNull(),
  lastPlayedAt: timestamp("last_played_at"),
  sourceContentId: int("source_content_id"), // Links a converted film back to its source podcast (null for originals)
});

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;

/**
 * User learning progress and analytics
 */
export const learningProgress = mysqlTable("learning_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  totalWordsLearned: int("total_words_learned").default(0).notNull(),
  totalStoriesGenerated: int("total_stories_generated").default(0).notNull(),
  totalTimeSpent: int("total_time_spent").default(0).notNull(), // In seconds
  currentStreak: int("current_streak").default(0).notNull(), // Days
  longestStreak: int("longest_streak").default(0).notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;

/**
 * Content favorites/bookmarks
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * User wordbank - saved vocabulary words for practice
 */
export const wordbank = mysqlTable("wordbank", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  word: text("word").notNull(),
  pinyin: text("pinyin"), // For Chinese words
  translation: text("translation").notNull(),
  targetLanguage: varchar("target_language", { length: 100 }).notNull(),
  exampleSentences: json("example_sentences").$type<string[]>(), // Array of example sentences
  audioUrl: text("audio_url"), // URL to pronunciation audio
  masteryLevel: varchar("mastery_level", { length: 20 })
    .default("learning")
    .notNull(), // learning, familiar, mastered
  timesCorrect: int("times_correct").default(0).notNull(),
  timesIncorrect: int("times_incorrect").default(0).notNull(),
  lastPracticedAt: timestamp("last_practiced_at"),
  // Spaced Repetition System (SRS) fields
  nextReviewDate: timestamp("next_review_date"), // When this word is due for review
  easeFactor: float("ease_factor").default(2.5).notNull(), // SM-2 ease factor (2.5 is default)
  interval: int("interval").default(1).notNull(), // Days until next review
  repetitions: int("repetitions").default(0).notNull(), // Number of successful reviews
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Wordbank = typeof wordbank.$inferSelect;
export type InsertWordbank = typeof wordbank.$inferInsert;

/**
 * Dismissed mastery suggestions - tracks words user wants to keep practicing
 */
export const dismissedSuggestions = mysqlTable("dismissed_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  wordbankId: int("wordbank_id").notNull(),
  dismissedAt: timestamp("dismissed_at").defaultNow().notNull(),
});

export type DismissedSuggestion = typeof dismissedSuggestions.$inferSelect;
export type InsertDismissedSuggestion =
  typeof dismissedSuggestions.$inferInsert;

/**
 * Practice history - tracks wordbank practice sessions
 */
export const practiceHistory = mysqlTable("practice_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  wordbankId: int("wordbank_id").notNull(),
  quizMode: varchar("quiz_mode", { length: 50 }).notNull(), // flashcard, multiple_choice, fill_in_blank
  isCorrect: boolean("is_correct").notNull(),
  xpEarned: int("xp_earned").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PracticeHistory = typeof practiceHistory.$inferSelect;
export type InsertPracticeHistory = typeof practiceHistory.$inferInsert;

/**
 * Quiz attempts and results
 */
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  score: int("score").notNull(), // Number of correct answers
  totalQuestions: int("total_questions").notNull(),
  answers: text("answers").notNull(), // JSON string of user answers
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

/**
 * Word mastery tracking for spaced repetition
 * Based on SuperMemo SM-2 algorithm
 */
export const wordMastery = mysqlTable("word_mastery", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  word: varchar("word", { length: 255 }).notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  easinessFactor: int("easiness_factor").default(2500).notNull(), // Stored as integer (2.5 = 2500)
  interval: int("interval").default(0).notNull(), // Days until next review
  repetitions: int("repetitions").default(0).notNull(), // Number of successful reviews
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  correctCount: int("correct_count").default(0).notNull(),
  incorrectCount: int("incorrect_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WordMastery = typeof wordMastery.$inferSelect;
export type InsertWordMastery = typeof wordMastery.$inferInsert;

/**
 * Story progress tracking for resume functionality
 */
export const storyProgress = mysqlTable("story_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  currentSentence: int("current_sentence").default(0).notNull(),
  currentTime: float("current_time").default(0).notNull(), // Playback position in seconds
  totalDuration: float("total_duration").default(0).notNull(), // Total audio duration
  completed: boolean("completed").default(false).notNull(),
  lastWatchedAt: timestamp("last_watched_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type StoryProgress = typeof storyProgress.$inferSelect;
export type InsertStoryProgress = typeof storyProgress.$inferInsert;

/**
 * Watch history for tracking all content viewing sessions
 */
export const watchHistory = mysqlTable("watch_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  contentId: int("content_id").notNull(),
  watchedAt: timestamp("watched_at").defaultNow().notNull(),
  duration: float("duration").notNull(), // How long they watched in seconds
  completed: boolean("completed").default(false).notNull(),
  progressPercentage: float("progress_percentage").default(0).notNull(), // 0-100
});

export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = typeof watchHistory.$inferInsert;

/**
 * Batch jobs for bulk content generation
 */
export const batchJobs = mysqlTable("batch_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalItems: int("total_items").notNull(),
  completedItems: int("completed_items").default(0).notNull(),
  failedItems: int("failed_items").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"])
    .default("pending")
    .notNull(),
  csvData: text("csv_data").notNull(), // JSON array of parsed CSV rows
  results: text("results"), // JSON array of generated content IDs and errors
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;

/**
 * Organizations (schools, institutions, companies)
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["school", "university", "corporate", "other"])
    .default("school")
    .notNull(),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactName: varchar("contact_name", { length: 255 }),
  maxStudents: int("max_students").default(100).notNull(), // License limit
  maxTeachers: int("max_teachers").default(10).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  subscriptionTier: mysqlEnum("subscription_tier", [
    "trial",
    "basic",
    "premium",
    "enterprise",
  ])
    .default("trial")
    .notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // Stripe Customer ID
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }), // Stripe Subscription ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Organization administrators
 */
export const organizationAdmins = mysqlTable("organization_admins", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrganizationAdmin = typeof organizationAdmins.$inferSelect;
export type InsertOrganizationAdmin = typeof organizationAdmins.$inferInsert;

/**
 * Classes (cohorts, groups)
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  teacherId: int("teacher_id").notNull(), // User ID of the teacher
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Class members (student-class relationships)
 */
export const classMembers = mysqlTable("class_members", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("class_id").notNull(),
  userId: int("user_id").notNull(), // Student user ID
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "inactive", "removed"])
    .default("active")
    .notNull(),
});

export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = typeof classMembers.$inferInsert;

/**
 * Assignments (teacher assigns content to classes)
 */
export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("class_id").notNull(),
  teacherId: int("teacher_id").notNull(),
  contentId: int("content_id"), // Optional: specific content to assign
  vocabularyListId: int("vocabulary_list_id"), // Optional: vocabulary list to generate from
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

/**
 * Assignment submissions (student completion tracking)
 */
export const assignmentSubmissions = mysqlTable("assignment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignment_id").notNull(),
  userId: int("user_id").notNull(), // Student user ID
  contentId: int("content_id"), // Generated content for this submission
  status: mysqlEnum("status", [
    "not_started",
    "in_progress",
    "completed",
    "overdue",
  ])
    .default("not_started")
    .notNull(),
  completedAt: timestamp("completed_at"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission =
  typeof assignmentSubmissions.$inferInsert;

/**
 * Enrollment invitations for students to join classes
 */
export const enrollmentInvitations = mysqlTable("enrollment_invitations", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("class_id").notNull(),
  teacherId: int("teacher_id").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"])
    .default("pending")
    .notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
});

export type EnrollmentInvitation = typeof enrollmentInvitations.$inferSelect;
export type InsertEnrollmentInvitation =
  typeof enrollmentInvitations.$inferInsert;

/**
 * User-created collections for organizing stories
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#8B5CF6"), // Hex color code
  shareToken: varchar("share_token", { length: 64 }).unique(), // Unique token for public sharing
  isPublic: boolean("is_public").default(false).notNull(), // Whether collection is publicly accessible
  cloneCount: int("clone_count").default(0).notNull(), // Number of times this collection has been cloned
  viewCount: int("view_count").default(0).notNull(), // Number of times this collection has been viewed
  isFeatured: boolean("is_featured").default(false).notNull(), // Whether this collection is currently featured
  featuredAt: timestamp("featured_at"), // When this collection was featured
  featuredUntil: timestamp("featured_until"), // When the featured status expires
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * Items within collections (many-to-many relationship with stories)
 */
export const collectionItems = mysqlTable("collection_items", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collection_id").notNull(),
  contentId: int("content_id").notNull(),
  position: int("position").default(0).notNull(), // For drag-and-drop ordering
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = typeof collectionItems.$inferInsert;

/**
 * Collection view analytics - tracks daily view trends
 */
export const collectionViewAnalytics = mysqlTable("collection_view_analytics", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collection_id").notNull(),
  viewDate: date("view_date").notNull(), // Date of views (YYYY-MM-DD)
  viewCount: int("view_count").default(0).notNull(), // Number of views on this date
  uniqueViewers: int("unique_viewers").default(0).notNull(), // Unique users who viewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CollectionViewAnalytics =
  typeof collectionViewAnalytics.$inferSelect;
export type InsertCollectionViewAnalytics =
  typeof collectionViewAnalytics.$inferInsert;

/**
 * Collection clone analytics - tracks daily clone trends
 */
export const collectionCloneAnalytics = mysqlTable(
  "collection_clone_analytics",
  {
    id: int("id").autoincrement().primaryKey(),
    collectionId: int("collection_id").notNull(),
    cloneDate: date("clone_date").notNull(), // Date of clones (YYYY-MM-DD)
    cloneCount: int("clone_count").default(0).notNull(), // Number of clones on this date
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export type CollectionCloneAnalytics =
  typeof collectionCloneAnalytics.$inferSelect;
export type InsertCollectionCloneAnalytics =
  typeof collectionCloneAnalytics.$inferInsert;

/**
 * Collection share events - tracks social sharing activity
 */
export const collectionShareEvents = mysqlTable("collection_share_events", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collection_id").notNull(),
  userId: int("user_id"), // Optional - may be null for anonymous shares
  platform: mysqlEnum("platform", [
    "twitter",
    "linkedin",
    "facebook",
    "copy_link",
  ]).notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

export type CollectionShareEvent = typeof collectionShareEvents.$inferSelect;
export type InsertCollectionShareEvent =
  typeof collectionShareEvents.$inferInsert;

/**
 * Tracks which milestones have been reached and notified for collections
 */
export const collectionMilestones = mysqlTable("collection_milestones", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collection_id").notNull(),
  milestoneType: varchar("milestone_type", { length: 50 }).notNull(), // "views_100", "clones_50", "views_500", "clones_100"
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
  notificationSent: boolean("notification_sent").default(false).notNull(),
  notificationSentAt: timestamp("notification_sent_at"),
});

export type CollectionMilestone = typeof collectionMilestones.$inferSelect;
export type InsertCollectionMilestone =
  typeof collectionMilestones.$inferInsert;

/**
 * User follows (social connections between users)
 */
export const userFollows = mysqlTable("user_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("follower_id").notNull(), // User who is following
  followingId: int("following_id").notNull(), // User being followed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

/**
 * User notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // User receiving the notification
  type: mysqlEnum("type", [
    "new_follower",
    "new_collection",
    "collection_featured",
    "badge_earned",
    "story_ready",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  relatedUserId: int("related_user_id"), // For follower notifications
  relatedCollectionId: int("related_collection_id"), // For collection notifications
  relatedContentId: int("related_content_id"), // For story_ready notifications - links to generated_content
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Recently viewed items for quick access
 */
export const recentlyViewed = mysqlTable("recently_viewed", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  itemType: mysqlEnum("item_type", [
    "story",
    "collection",
    "wordbank",
  ]).notNull(),
  itemId: int("item_id").notNull(), // ID of the story, collection, or other item
  itemTitle: varchar("item_title", { length: 500 }), // Cached title for display
  itemThumbnail: text("item_thumbnail"), // Cached thumbnail URL
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export type RecentlyViewed = typeof recentlyViewed.$inferSelect;
export type InsertRecentlyViewed = typeof recentlyViewed.$inferInsert;

/**
 * Language level test results
 */
export const levelTestResults = mysqlTable("level_test_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  proficiencyLevel: mysqlEnum("proficiency_level", [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
  ]).notNull(),
  score: int("score").notNull(), // Percentage score (0-100)
  totalQuestions: int("total_questions").notNull(),
  correctAnswers: int("correct_answers").notNull(),
  testData: text("test_data"), // JSON string of questions and answers
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LevelTestResult = typeof levelTestResults.$inferSelect;
export type InsertLevelTestResult = typeof levelTestResults.$inferInsert;

/**
 * Tone practice history - tracks Chinese tone practice attempts
 */
export const tonePracticeHistory = mysqlTable("tone_practice_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  character: varchar("character", { length: 10 }).notNull(), // The Chinese character tested
  pinyin: varchar("pinyin", { length: 20 }).notNull(), // The pinyin with tone mark
  correctTone: int("correct_tone").notNull(), // 1, 2, 3, or 4
  selectedTone: int("selected_tone").notNull(), // User's answer
  isCorrect: boolean("is_correct").notNull(),
  responseTimeMs: int("response_time_ms"), // Time taken to answer in milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TonePracticeHistory = typeof tonePracticeHistory.$inferSelect;
export type InsertTonePracticeHistory = typeof tonePracticeHistory.$inferInsert;

/**
 * Tone mastery statistics - aggregated stats per user per tone
 */
export const toneMasteryStats = mysqlTable("tone_mastery_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  tone: int("tone").notNull(), // 1, 2, 3, or 4
  totalAttempts: int("total_attempts").default(0).notNull(),
  correctAttempts: int("correct_attempts").default(0).notNull(),
  accuracyPercentage: float("accuracy_percentage").default(0).notNull(),
  lastPracticedAt: timestamp("last_practiced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ToneMasteryStats = typeof toneMasteryStats.$inferSelect;
export type InsertToneMasteryStats = typeof toneMasteryStats.$inferInsert;

/**
 * Voice favorites - tracks user's preferred voice combinations
 */
export const voiceFavorites = mysqlTable("voice_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  voiceType: varchar("voice_type", { length: 100 }).notNull(), // "Warm & Friendly", "Professional Narrator", etc.
  narratorGender: mysqlEnum("narrator_gender", ["male", "female"]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VoiceFavorite = typeof voiceFavorites.$inferSelect;
export type InsertVoiceFavorite = typeof voiceFavorites.$inferInsert;

/**
 * Breadcrumb preferences - user customization for breadcrumb navigation
 */
export const breadcrumbPreferences = mysqlTable("breadcrumb_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  showIcons: boolean("show_icons").default(true).notNull(),
  compactMode: boolean("compact_mode").default(false).notNull(),
  hideOnMobile: boolean("hide_on_mobile").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BreadcrumbPreferences = typeof breadcrumbPreferences.$inferSelect;
export type InsertBreadcrumbPreferences =
  typeof breadcrumbPreferences.$inferInsert;

/**
 * Collection badges - gamification badges for collections
 */
export const collectionBadges = mysqlTable("collection_badges", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collection_id").notNull(),
  badgeType: mysqlEnum("badge_type", [
    "trending", // High recent view growth
    "top_100", // In top 100 by total views
    "community_favorite", // High clone rate
    "rising_star", // New collection with rapid growth
    "viral", // Exceptional share rate
    "evergreen", // Consistent views over time
  ]).notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Some badges expire (e.g., trending)
  isActive: boolean("is_active").default(true).notNull(),
});

export type CollectionBadge = typeof collectionBadges.$inferSelect;
export type InsertCollectionBadge = typeof collectionBadges.$inferInsert;

/**
 * Email digest preferences - user settings for weekly creator emails
 */
export const emailDigestPreferences = mysqlTable("email_digest_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"])
    .default("weekly")
    .notNull(),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EmailDigestPreference = typeof emailDigestPreferences.$inferSelect;
export type InsertEmailDigestPreference =
  typeof emailDigestPreferences.$inferInsert;

/**
 * Weekly digest history - tracks sent digest emails
 */
export const weeklyDigestHistory = mysqlTable("weekly_digest_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  digestDate: date("digest_date").notNull(), // Week ending date
  totalViews: int("total_views").default(0).notNull(),
  totalClones: int("total_clones").default(0).notNull(),
  totalShares: int("total_shares").default(0).notNull(),
  newFollowers: int("new_followers").default(0).notNull(),
  topCollectionId: int("top_collection_id"), // Best performing collection
  milestonesReached: json("milestones_reached"), // Array of milestone achievements
  emailSent: boolean("email_sent").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeeklyDigestHistory = typeof weeklyDigestHistory.$inferSelect;
export type InsertWeeklyDigestHistory = typeof weeklyDigestHistory.$inferInsert;

/**
 * Collection categories - predefined categories for organization
 */
export const collectionCategories = mysqlTable("collection_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Emoji or icon name
  color: varchar("color", { length: 20 }).default("#8B5CF6"),
  displayOrder: int("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CollectionCategory = typeof collectionCategories.$inferSelect;
export type InsertCollectionCategory = typeof collectionCategories.$inferInsert;

/**
 * Collection category assignments - many-to-many relationship
 */
export const collectionCategoryAssignments = mysqlTable(
  "collection_category_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    collectionId: int("collection_id").notNull(),
    categoryId: int("category_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export type CollectionCategoryAssignment =
  typeof collectionCategoryAssignments.$inferSelect;
export type InsertCollectionCategoryAssignment =
  typeof collectionCategoryAssignments.$inferInsert;

/**
 * Collection tags - flexible tagging system
 */
export const collectionTags = mysqlTable("collection_tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  usageCount: int("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CollectionTag = typeof collectionTags.$inferSelect;
export type InsertCollectionTag = typeof collectionTags.$inferInsert;

/**
 * Collection tag assignments - many-to-many relationship
 */
export const collectionTagAssignments = mysqlTable(
  "collection_tag_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    collectionId: int("collection_id").notNull(),
    tagId: int("tag_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export type CollectionTagAssignment =
  typeof collectionTagAssignments.$inferSelect;
export type InsertCollectionTagAssignment =
  typeof collectionTagAssignments.$inferInsert;

/**
 * Digest jobs - tracks scheduled digest email jobs
 */
export const digestJobs = mysqlTable("digest_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobType: mysqlEnum("job_type", [
    "weekly_digest",
    "story_highlights",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"])
    .default("pending")
    .notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalUsers: int("total_users").default(0).notNull(),
  processedUsers: int("processed_users").default(0).notNull(),
  successCount: int("success_count").default(0).notNull(),
  failureCount: int("failure_count").default(0).notNull(),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DigestJob = typeof digestJobs.$inferSelect;
export type InsertDigestJob = typeof digestJobs.$inferInsert;

/**
 * User digests - stores generated digest data for in-app viewing
 */
export const userDigests = mysqlTable("user_digests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  digestType: mysqlEnum("digest_type", [
    "weekly_creator",
    "story_highlights",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: json("content").notNull(), // Structured digest data
  weekStartDate: date("week_start_date"),
  weekEndDate: date("week_end_date"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserDigest = typeof userDigests.$inferSelect;
export type InsertUserDigest = typeof userDigests.$inferInsert;

/**
 * Push subscriptions - stores browser push notification subscriptions
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  subscription: text("subscription").notNull(), // JSON string of PushSubscription
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Notification preferences - user preferences for different notification types
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  weeklyGoalReminders: boolean("weekly_goal_reminders").default(true).notNull(),
  achievementNotifications: boolean("achievement_notifications")
    .default(true)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference =
  typeof notificationPreferences.$inferInsert;

/**
 * Leaderboard entries - tracks user rankings for weekly achievements
 */
export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  goalsCompleted: int("goals_completed").default(0).notNull(),
  streakDays: int("streak_days").default(0).notNull(),
  xpEarned: int("xp_earned").default(0).notNull(),
  rank: int("rank"),
  isVisible: boolean("is_visible").default(true).notNull(), // Privacy setting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

/**
 * Achievement shares - tracks when users share their achievements
 */
export const achievementShares = mysqlTable("achievement_shares", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  achievementType: varchar("achievement_type", { length: 50 }).notNull(), // e.g., "7_day_streak", "30_day_streak"
  platform: mysqlEnum("platform", [
    "twitter",
    "facebook",
    "linkedin",
  ]).notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

export type AchievementShare = typeof achievementShares.$inferSelect;
export type InsertAchievementShare = typeof achievementShares.$inferInsert;

/**
 * Referral codes - unique codes generated by Premium users
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // Premium user who owns this code
  code: varchar("code", { length: 20 }).notNull().unique(), // Unique referral code (e.g., "ALICE2026")
  discountPercent: int("discount_percent").default(20).notNull(), // Discount for referred user (20%)
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: int("usage_count").default(0).notNull(), // Number of times code was used
  maxUsage: int("max_usage"), // Optional usage limit (null = unlimited)
  expiresAt: timestamp("expires_at"), // Optional expiration date
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

/**
 * Referral conversions - tracks successful referrals and rewards
 */
export const referralConversions = mysqlTable("referral_conversions", {
  id: int("id").autoincrement().primaryKey(),
  referralCodeId: int("referral_code_id").notNull(), // Which code was used
  referrerId: int("referrer_id").notNull(), // Premium user who gets the reward
  referredUserId: int("referred_user_id").notNull(), // New user who signed up
  referredUserEmail: varchar("referred_user_email", { length: 320 }), // Email of referred user
  discountApplied: int("discount_applied").notNull(), // Discount percentage applied
  rewardMonths: int("reward_months").default(1).notNull(), // Free months earned by referrer (default: 1)
  rewardStatus: mysqlEnum("reward_status", ["pending", "applied", "expired"])
    .default("pending")
    .notNull(),
  rewardAppliedAt: timestamp("reward_applied_at"), // When reward was credited
  subscriptionStartedAt: timestamp("subscription_started_at"), // When referred user subscribed
  createdAt: timestamp("created_at").defaultNow().notNull(), // When referral link was used
});

export type ReferralConversion = typeof referralConversions.$inferSelect;
export type InsertReferralConversion = typeof referralConversions.$inferInsert;

/**
 * Referral rewards - tracks accumulated free months for referrers
 */
export const referralRewards = mysqlTable("referral_rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(), // Premium user earning rewards
  totalMonthsEarned: int("total_months_earned").default(0).notNull(), // Total free months earned
  monthsUsed: int("months_used").default(0).notNull(), // Free months already applied
  monthsAvailable: int("months_available").default(0).notNull(), // Remaining free months
  lastRewardAt: timestamp("last_reward_at"), // Last time a reward was earned
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;

/**
 * Affiliate link clicks - tracks every click on affiliate referral links
 */
export const affiliateClicks = mysqlTable("affiliate_clicks", {
  id: int("id").autoincrement().primaryKey(),
  referralCodeId: int("referral_code_id").notNull(), // Which referral code was clicked
  affiliateUserId: int("affiliate_user_id").notNull(), // Affiliate who owns the link
  ipAddress: varchar("ip_address", { length: 45 }), // IP address of clicker (for analytics)
  userAgent: text("user_agent"), // Browser/device info
  referrerUrl: text("referrer_url"), // Where the click came from
  landingPage: varchar("landing_page", { length: 500 }), // Which page they landed on
  converted: boolean("converted").default(false).notNull(), // Did this click result in a signup?
  convertedUserId: int("converted_user_id"), // If converted, which user ID
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = typeof affiliateClicks.$inferInsert;

/**
 * Affiliate earnings - tracks commission earnings for affiliates
 */
export const affiliateEarnings = mysqlTable("affiliate_earnings", {
  id: int("id").autoincrement().primaryKey(),
  affiliateUserId: int("affiliate_user_id").notNull(), // Affiliate earning the commission
  referralCodeId: int("referral_code_id").notNull(), // Which code generated this earning
  referredUserId: int("referred_user_id").notNull(), // User who was referred
  conversionType: mysqlEnum("conversion_type", [
    "signup",
    "premium_monthly",
    "premium_annual",
  ]).notNull(),
  commissionAmount: decimal("commission_amount", {
    precision: 10,
    scale: 2,
  }).notNull(), // Amount earned in USD
  commissionPercent: int("commission_percent").notNull(), // Commission rate applied (e.g., 20 for 20%)
  subscriptionAmount: decimal("subscription_amount", {
    precision: 10,
    scale: 2,
  }), // Original subscription amount
  payoutStatus: mysqlEnum("payout_status", [
    "pending",
    "processing",
    "paid",
    "failed",
  ])
    .default("pending")
    .notNull(),
  paidAt: timestamp("paid_at"), // When commission was paid out
  paymentMethod: varchar("payment_method", { length: 50 }), // stripe, paypal, etc.
  paymentReference: varchar("payment_reference", { length: 255 }), // Transaction ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateEarning = typeof affiliateEarnings.$inferSelect;
export type InsertAffiliateEarning = typeof affiliateEarnings.$inferInsert;

/**
 * Affiliate payout requests - tracks withdrawal requests from affiliates
 */
export const affiliatePayouts = mysqlTable("affiliate_payouts", {
  id: int("id").autoincrement().primaryKey(),
  affiliateUserId: int("affiliate_user_id").notNull(),
  requestedAmount: decimal("requested_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "processing",
    "completed",
    "rejected",
  ])
    .default("pending")
    .notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // stripe, paypal, bank_transfer
  paymentDetails: text("payment_details"), // Encrypted payment info (email, account number, etc.)
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
  transactionId: varchar("transaction_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type InsertAffiliatePayout = typeof affiliatePayouts.$inferInsert;

/**
 * Chat conversations - stores chatbot conversation sessions
 */
export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  mode: varchar("mode", { length: 50 }).notNull(), // 'languagePractice' or 'support'
  language: varchar("language", { length: 50 }).notNull().default("English"),
  level: varchar("level", { length: 50 }).notNull().default("intermediate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

/**
 * Chat messages - stores individual messages in conversations
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversation_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Spaced Repetition System (SRS) - SM-2 Algorithm Implementation
 */
export const srsReviews = mysqlTable("srs_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  wordId: int("word_id").notNull(),
  easeFactor: float("ease_factor").notNull().default(2.5),
  interval: int("interval").notNull().default(1),
  repetitions: int("repetitions").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("learning"),
  isLapsed: boolean("is_lapsed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const reviewHistory = mysqlTable("review_history", {
  id: int("id").autoincrement().primaryKey(),
  srsReviewId: int("srs_review_id").notNull(),
  userId: int("user_id").notNull(),
  wordId: int("word_id").notNull(),
  quality: int("quality").notNull(),
  responseType: varchar("response_type", { length: 20 }).notNull(),
  easeFactorBefore: float("ease_factor_before").notNull(),
  easeFactorAfter: float("ease_factor_after").notNull(),
  intervalBefore: int("interval_before").notNull(),
  intervalAfter: int("interval_after").notNull(),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
  timeSpentMs: int("time_spent_ms"),
});

export const reviewReminders = mysqlTable("review_reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  dailyReminderTime: varchar("daily_reminder_time", { length: 5 }).default(
    "09:00"
  ),
  emailReminders: boolean("email_reminders").notNull().default(true),
  pushReminders: boolean("push_reminders").notNull().default(true),
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * A/B Testing: Experiments
 * Each experiment has a unique key (e.g. "weekly_limit_cta") and multiple variants.
 */
export const abExperiments = mysqlTable("ab_experiments", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * A/B Testing: Variants
 * Each variant belongs to an experiment and has a weight for traffic splitting.
 */
export const abVariants = mysqlTable("ab_variants", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: int("experiment_id").notNull(),
  variantKey: varchar("variant_key", { length: 50 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  payload: json("payload"),
  weight: int("weight").default(50).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * A/B Testing: User Assignments
 * Once a user is bucketed into a variant, they stay there for the experiment's lifetime.
 */
export const abAssignments = mysqlTable("ab_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  experimentId: int("experiment_id").notNull(),
  variantId: int("variant_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

/**
 * A/B Testing: Events
 * Track impressions (modal shown) and conversions (CTA clicked) per assignment.
 */
export const abEvents = mysqlTable("ab_events", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignment_id").notNull(),
  userId: int("user_id").notNull(),
  experimentId: int("experiment_id").notNull(),
  variantId: int("variant_id").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
