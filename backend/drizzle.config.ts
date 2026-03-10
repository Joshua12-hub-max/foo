import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`;

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: dbUrl,
  },
  strict: true,
  verbose: true,
});
