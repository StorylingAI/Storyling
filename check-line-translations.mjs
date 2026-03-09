import { db } from './server/db.js';
import { content } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const story = await db.select().from(content).where(eq(content.id, 390010)).limit(1);
console.log('Story ID:', story[0]?.id);
console.log('Has lineTranslations:', !!story[0]?.lineTranslations);
console.log('lineTranslations:', JSON.stringify(story[0]?.lineTranslations, null, 2));
process.exit(0);
