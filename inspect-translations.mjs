import { getDb } from './server/db.ts';
import { generatedContent } from './drizzle/schema.ts';
import { eq, like } from 'drizzle-orm';

// Find the Spanish story
const db = await getDb();
const story = await db
  .select()
  .from(generatedContent)
  .where(like(generatedContent.storyText, '%Vivo en un castillo%'))
  .limit(1);

if (story.length === 0) {
  console.log('Story not found');
  process.exit(1);
}

const content = story[0];
console.log('\n=== Story Info ===');
console.log('ID:', content.id);
console.log('Title:', content.title);
console.log('\n=== Story Text (first 200 chars) ===');
console.log(content.storyText.substring(0, 200));

console.log('\n=== Client-side Sentence Splitting ===');
// This is the same logic as in SentenceDisplay.tsx
const sentences = content.storyText
  .split(/([.!?。！？]+)/)
  .reduce((acc, curr, idx, arr) => {
    if (idx % 2 === 0 && curr.trim()) {
      const punctuation = arr[idx + 1] || "";
      acc.push((curr + punctuation).trim());
    }
    return acc;
  }, [])
  .filter((s) => s.length > 0);

console.log('Total sentences:', sentences.length);
console.log('\nFirst 5 sentences:');
sentences.slice(0, 5).forEach((s, i) => {
  console.log(`${i}: ${s}`);
});

console.log('\n=== Line Translations from Database ===');
const lineTranslations = content.lineTranslations || [];
console.log('Total translations:', lineTranslations.length);
console.log('\nFirst 5 translations:');
lineTranslations.slice(0, 5).forEach((t, i) => {
  console.log(`${i}:`);
  console.log(`  Original: ${t.original}`);
  console.log(`  English: ${t.english}`);
});

console.log('\n=== Comparison ===');
console.log('Sentence 0 from split:', sentences[0]);
console.log('Translation 0 original:', lineTranslations[0]?.original);
console.log('Match:', sentences[0] === lineTranslations[0]?.original);

console.log('\nSentence 3 from split:', sentences[3]);
console.log('Translation 3 original:', lineTranslations[3]?.original);
console.log('Match:', sentences[3] === lineTranslations[3]?.original);

process.exit(0);
