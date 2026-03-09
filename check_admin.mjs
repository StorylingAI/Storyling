import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const users = await db.execute('SELECT id, name, email, role FROM users LIMIT 5');
console.log('Current users:', JSON.stringify(users[0], null, 2));

await connection.end();
