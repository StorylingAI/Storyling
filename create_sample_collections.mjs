import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get the owner user ID
const [users] = await db.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
const userId = users[0]?.id || 1;

const sampleCollections = [
  {
    name: 'Chinese Business HSK 4',
    targetLanguage: 'zh',
    proficiencyLevel: 'HSK 4',
    words: '会议,业务,合作,投资,市场,客户,产品,服务,价格,质量,销售,利润,竞争,战略,目标,计划,预算,报告,数据,分析',
    description: 'Essential business vocabulary for HSK 4 level Chinese learners. Perfect for professionals working in Chinese business environments.',
    isPublic: true,
    slug: 'chinese-business-hsk-4'
  },
  {
    name: 'Spanish Travel Phrases',
    targetLanguage: 'es',
    proficiencyLevel: 'A2',
    words: 'aeropuerto,hotel,restaurante,taxi,boleto,maleta,pasaporte,reserva,habitación,cuenta,menú,propina,dirección,mapa,estación,autobús,tren,playa,museo,mercado',
    description: 'Must-know Spanish phrases for travelers. Navigate airports, hotels, restaurants, and tourist attractions with confidence.',
    isPublic: true,
    slug: 'spanish-travel-phrases'
  },
  {
    name: 'French Cuisine Vocabulary',
    targetLanguage: 'fr',
    proficiencyLevel: 'B1',
    words: 'restaurant,menu,entrée,plat,dessert,boisson,vin,fromage,pain,viande,poisson,légumes,fruits,épices,cuisson,recette,chef,serveur,addition,pourboire',
    description: 'Explore French culinary culture with this comprehensive food and dining vocabulary collection.',
    isPublic: true,
    slug: 'french-cuisine-vocabulary'
  },
  {
    name: 'German Office Essentials',
    targetLanguage: 'de',
    proficiencyLevel: 'B1',
    words: 'Büro,Computer,Telefon,E-Mail,Besprechung,Projekt,Kollege,Chef,Abteilung,Termin,Dokument,Datei,Drucker,Bildschirm,Tastatur,Schreibtisch,Stuhl,Pause,Kaffee,Mittagessen',
    description: 'Essential German vocabulary for office workers and business professionals.',
    isPublic: true,
    slug: 'german-office-essentials'
  },
  {
    name: 'Japanese Daily Conversation',
    targetLanguage: 'ja',
    proficiencyLevel: 'N5',
    words: 'おはよう,こんにちは,こんばんは,ありがとう,すみません,はい,いいえ,わかりました,お願いします,どうぞ,ごめんなさい,さようなら,また,元気,名前,仕事,家,学校,友達,家族',
    description: 'Basic Japanese phrases for everyday conversations. Perfect for beginners (JLPT N5 level).',
    isPublic: true,
    slug: 'japanese-daily-conversation'
  },
  {
    name: 'Korean K-Pop & Culture',
    targetLanguage: 'ko',
    proficiencyLevel: 'Beginner',
    words: '노래,음악,가수,아이돌,팬,콘서트,앨범,뮤직비디오,춤,무대,인기,사랑,친구,행복,꿈,희망,열정,감동,응원,화이팅',
    description: 'Learn Korean through K-Pop culture! Essential vocabulary for understanding Korean music and entertainment.',
    isPublic: true,
    slug: 'korean-kpop-culture'
  },
  {
    name: 'Arabic Greetings & Politeness',
    targetLanguage: 'ar',
    proficiencyLevel: 'A1',
    words: 'السلام عليكم,صباح الخير,مساء الخير,شكرا,من فضلك,عفوا,نعم,لا,اسمي,كيف حالك,بخير,مع السلامة,أهلا,مرحبا,تشرفنا,الحمد لله,ما شاء الله,بارك الله فيك,جزاك الله خيرا,إن شاء الله',
    description: 'Master Arabic greetings and polite expressions. Essential for respectful communication in Arabic-speaking countries.',
    isPublic: true,
    slug: 'arabic-greetings-politeness'
  },
  {
    name: 'Italian Food & Cooking',
    targetLanguage: 'it',
    proficiencyLevel: 'A2',
    words: 'pasta,pizza,pane,formaggio,vino,olio,pomodoro,basilico,aglio,cipolla,carne,pesce,verdure,frutta,dolce,gelato,caffè,acqua,sale,pepe',
    description: 'Delicious Italian food vocabulary for cooking enthusiasts and travelers.',
    isPublic: true,
    slug: 'italian-food-cooking'
  },
  {
    name: 'Portuguese Brazilian Slang',
    targetLanguage: 'pt',
    proficiencyLevel: 'B2',
    words: 'legal,bacana,massa,maneiro,cara,mano,galera,valeu,beleza,tranquilo,saudade,joia,show,demais,firmeza,falou,tá ligado,partiu,bora,top',
    description: 'Authentic Brazilian Portuguese slang and colloquial expressions. Sound like a native speaker!',
    isPublic: true,
    slug: 'portuguese-brazilian-slang'
  },
  {
    name: 'Russian Winter & Weather',
    targetLanguage: 'ru',
    proficiencyLevel: 'A2',
    words: 'зима,снег,холод,мороз,лёд,ветер,погода,температура,градус,тепло,холодно,пальто,шапка,шарф,перчатки,сапоги,дом,улица,город,парк',
    description: 'Essential Russian vocabulary for discussing winter weather and staying warm in cold climates.',
    isPublic: true,
    slug: 'russian-winter-weather'
  }
];

console.log(`Creating ${sampleCollections.length} sample vocabulary collections...`);

for (const collection of sampleCollections) {
  try {
    await db.execute(`
      INSERT INTO vocabulary_lists (userId, name, targetLanguage, proficiencyLevel, words, description, isPublic, slug, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [userId, collection.name, collection.targetLanguage, collection.proficiencyLevel, collection.words, collection.description, collection.isPublic, collection.slug]);
    
    console.log(`✓ Created: ${collection.name}`);
  } catch (error) {
    console.log(`✗ Skipped: ${collection.name} (already exists or error: ${error.message})`);
  }
}

console.log('\nDone! Sample collections created.');
await connection.end();
