import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import * as schema from './schema';

const DB_PATH = path.join(process.cwd(), 'citysync.db');

const sqlite = new Database(DB_PATH);
// WAL mode allows concurrent reads while a write is in progress
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
