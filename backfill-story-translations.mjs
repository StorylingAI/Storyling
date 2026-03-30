import { appRouter } from './server/routers.ts';

// Create a mock context with the user ID
const ctx = {
  user: {
    id: 1, // Replace with actual user ID if needed
    openId: 'test',
    name: 'Test User',
    role: 'user'
  }
};

const caller = appRouter.createCaller(ctx);

// Call the backfill mutation for content ID 390010
const contentId = 360001;

console.log(`[Backfill] Starting backfill for content ID: ${contentId}`);

try {
  const result = await caller.content.backfillVocabularyTranslations({ contentId });
  console.log('[Backfill] Success!', result);
} catch (error) {
  console.error('[Backfill] Error:', error);
}

process.exit(0);
