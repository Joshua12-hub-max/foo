import { PDSParserService } from '../services/PDSParserService.js';
import fs from 'fs';
import path from 'path';

async function testParse() {
  const filePath = path.join(process.cwd(), 'pdsexel.md', 'Personal-Data-Sheet-CS-Form-No.-212-Revised-2025 Joshua data.xlsx');
  console.log('Parsing file:', filePath);
  
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await PDSParserService.parseFromBuffer(buffer);
    console.log('--- PARSE RESULT ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error parsing PDS:', error);
  }
}

testParse();
