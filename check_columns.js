const mysql = require('mysql2/promise'); 
require('dotenv').config({ path: 'backend/.env' }); 

(async () => { 
    try { 
        const conn = await mysql.createConnection({ 
            host: process.env.DB_HOST, 
            user: process.env.DB_USER, 
            password: process.env.DB_PASSWORD, 
            database: process.env.DB_NAME 
        }); 
        const [rows] = await conn.query("SHOW COLUMNS FROM recruitment_jobs LIKE 'linkedin_post_id'"); 
        console.log('Column linkedin_post_id found:', rows.length > 0 ? 'YES' : 'NO'); 
        
        const [fbRows] = await conn.query("SHOW COLUMNS FROM recruitment_jobs LIKE 'fb_post_id'"); 
        console.log('Column fb_post_id found:', fbRows.length > 0 ? 'YES' : 'NO'); 
        
        process.exit(0); 
    } catch (e) { 
        console.error(e); 
        process.exit(1); 
    } 
})();
