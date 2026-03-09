import { db } from './server/db.ts';
import { generatedContent } from './drizzle/schema.ts';
import { isNull } from 'drizzle-orm';

const stories = await db.select().from(generatedContent).where(isNull(generatedContent.vocabularyTranslations)).limit(10);
console.log('Stories with null vocabularyTranslations:', stories.length);
stories.forEach(s => console.log('ID:', s.id, 'Title:', s.title, 'Status:', s.status, 'Created:', s.createdAt));
process.exit(0);
