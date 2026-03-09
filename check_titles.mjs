import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const results = await db.select({
  id: schema.generatedContent.id,
  title: schema.generatedContent.title,
  theme: schema.generatedContent.theme,
  mode: schema.generatedContent.mode,
  status: schema.generatedContent.status
}).from(schema.generatedContent).limit(5);

console.log('Stories:', JSON.stringify(results, null, 2));
await connection.end();
