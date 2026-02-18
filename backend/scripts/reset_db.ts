import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';

dotenv.config();

const execAsync = util.promisify(exec);

async function resetDb() {
    console.log('⚠️  STARTING FULL DATABASE RESET ⚠️');
    console.log('This will DROP the database and recreate it.');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: Number(process.env.DB_PORT) || 3306,
    };

    const dbName = process.env.DB_NAME || 'chrmo_db';

    try {
        // 1. Connect to MySQL server (no database selected)
        console.log('Connecting to MySQL server...');
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            port: config.port,
        });

        // 2. Drop and Create Database
        console.log(`Dropping database '${dbName}'...`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        
        console.log(`Creating database '${dbName}'...`);
        await connection.query(`CREATE DATABASE \`${dbName}\``);
        
        await connection.end();
        console.log('Database recreated successfully.');

        // 3. Push Schema using Drizzle Kit
        console.log('Pushing schema to database...');
        // We use 'tsx' to run drizzle-kit with proper ESM resolution for .js imports in TS files
        const drizzleKitBin = 'node_modules/drizzle-kit/bin.cjs';
        const cmd = `npx tsx ${drizzleKitBin} push`;
        
        console.log(`Running: ${cmd}`);
        const { stdout, stderr } = await execAsync(cmd);
        console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('✅ DATABASE RESET COMPLETE.');
        process.exit(0);

    } catch (err: any) {
        console.error('❌ RESET FAILED:', err.message);
        process.exit(1);
    }
}

resetDb();
