/**
 * Backfill difficulty levels for existing stories
 * 
 * This can be called via a tRPC procedure to update all existing generated_content
 * records that don't have a difficulty level.
 */

import { getDb } from "./db";
import { generatedContent, vocabularyLists } from "../drizzle/schema";
import { eq, isNull } from "drizzle-orm";
import { calculateDifficultyLevel } from "./difficultyLevel";

export async function backfillDifficultyLevels(): Promise<{
  success: number;
  errors: number;
  total: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

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
    return { success: 0, errors: 0, total: 0 };
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

  return {
    success: successCount,
    errors: errorCount,
    total: contentWithoutDifficulty.length,
  };
}
