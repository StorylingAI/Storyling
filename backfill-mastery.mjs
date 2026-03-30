import mysql from 'mysql2/promise';
import 'dotenv/config';

async function backfillMasteryRecords() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Find words without mastery records
    const [missing] = await connection.query(`
      SELECT w.id, w.user_id, w.word, w.target_language
      FROM wordbank w
      LEFT JOIN word_mastery wm ON (
        w.user_id = wm.user_id AND 
        w.word = wm.word AND 
        w.target_language = wm.target_language
      )
      WHERE wm.id IS NULL
    `);
    
    console.log(`Found ${missing.length} words without mastery records`);
    
    if (missing.length === 0) {
      console.log('No backfill needed!');
      return;
    }
    
    // Create mastery records for each missing word
    const now = new Date();
    const nextReview = new Date(now); // Review immediately (due now)
    
    for (const word of missing) {
      await connection.query(`
        INSERT INTO word_mastery (
          user_id, word, target_language, easiness_factor, 
          \`interval\`, repetitions, next_review_date, last_reviewed_at,
          correct_count, incorrect_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        word.user_id,
        word.word,
        word.target_language,
        2500, // Default 2.5 * 1000
        1, // 1 day
        0, // 0 repetitions
        nextReview,
        now,
        0, // 0 correct
        0  // 0 incorrect
      ]);
      
      console.log(`✓ Created mastery record for: ${word.word} (${word.target_language})`);
    }
    
    console.log(`\n✅ Successfully backfilled ${missing.length} mastery records!`);
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

backfillMasteryRecords();
