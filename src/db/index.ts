import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import * as schema from './schema';

const client = createClient({
  url: `file:${path.join(process.cwd(), 'citysync.db')}`,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
