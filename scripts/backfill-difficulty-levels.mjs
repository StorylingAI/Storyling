/**
 * Backfill difficulty levels for existing stories
 * 
 * This script updates all existing generated_content records that don't have
 * a difficulty level by calculating it based on the vocabulary list's proficiency level
 * and target language.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { generatedContent, vocabularyLists } from "../drizzle/schema.js";
import { eq, isNull } from "drizzle-orm";

// Calculate difficulty level based on target language and proficiency level
function calculateDifficultyLevel(targetLanguage, proficiencyLevel) {
  // For Chinese, use HSK levels (1-6)
  if (targetLanguage.toLowerCase() === "chinese" || targetLanguage.toLowerCase() === "mandarin") {
    // Map CEFR to HSK
    const cefrToHsk = {
      "A1": "HSK 1",
      "A2": "HSK 2",
      "B1": "HSK 3",
      "B2": "HSK 4",
      "C1": "HSK 5",
      "C2": "HSK 6",
    };
    return cefrToHsk[proficiencyLevel] || proficiencyLevel;
  }
  
  // For other languages, use CEFR levels (A1-C2)
  return proficiencyLevel;
}

async function backfillDifficultyLevels() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("🔍 Finding stories without difficulty levels...");

  // Find all content without difficulty levels
  const contentWithoutDifficulty = await db
    .select({
      contentId: generatedContent.id,
      vocabularyListId: generatedContent.vocabularyListId,
    })
    .from(generatedContent)
    .where(isNull(generatedContent.difficultyLevel));

  console.log(`📊 Found ${contentWithoutDifficulty.length} stories to update`);

  if (contentWithoutDifficulty.length === 0) {
    console.log("✅ All stories already have difficulty levels!");
    process.exit(0);
  }

  let successCount = 0;
  let errorCount = 0;

  for (const content of contentWithoutDifficulty) {
    try {
      // Get the vocabulary list for this content
      const vocabList = await db
        .select()
        .from(vocabularyLists)
        .where(eq(vocabularyLists.id, content.vocabularyListId))
        .limit(1);

      if (!vocabList[0]) {
        console.warn(`⚠️  No vocabulary list found for content ${content.contentId}`);
        errorCount++;
        continue;
      }

      const { targetLanguage, proficiencyLevel } = vocabList[0];
      const difficultyLevel = calculateDifficultyLevel(targetLanguage, proficiencyLevel);

      // Update the content with the calculated difficulty level
      await db
        .update(generatedContent)
        .set({ difficultyLevel })
        .where(eq(generatedContent.id, content.contentId));

      successCount++;
      console.log(`✓ Updated content ${content.contentId}: ${difficultyLevel}`);
    } catch (error) {
      console.error(`✗ Error updating content ${content.contentId}:`, error);
      errorCount++;
    }
  }

  console.log("\n📈 Backfill complete!");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  process.exit(errorCount > 0 ? 1 : 0);
}

backfillDifficultyLevels().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
