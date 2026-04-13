import { normalizeIdJs } from '../utils/idUtils.ts';

const testIds = ['1', '99', '100', '1000', '12345', 'Emp-1', 'Emp-100'];

console.log('--- JS NORMALIZATION TEST ---');
testIds.forEach(id => {
  console.log(`Input: ${id.padEnd(10)} | Output: ${normalizeIdJs(id)}`);
});

/**
 * SIMULATED SQL NORMALIZATION TEST
 * This replicates the logic: CONCAT('Emp-', LPAD(REGEXP_REPLACE(column, '[^0-9]', ''), 10, '0'))
 */
const simulateSqlNormalize = (id: string) => {
  const numericPart = id.replace(/[^0-9]/g, '');
  const padded = numericPart.padStart(3, '0');
  return `Emp-${padded}`;
};

console.log('\n--- SQL SIMULATION TEST ---');
testIds.forEach(id => {
  const output = simulateSqlNormalize(id);
  console.log(`Input: ${id.padEnd(10)} | SQL (Sim): ${output}`);
  if (output !== normalizeIdJs(id)) {
      console.error('MISMATCH DETECTED!');
  }
});

console.log('\n--- BOUNDARY TEST ---');
const longId = '123456789012'; // 12 digits
console.log(`Long ID Input: ${longId}`);
console.log(`JS Result   : ${normalizeIdJs(longId)}`);
console.log(`SQL Result  : ${simulateSqlNormalize(longId)}`);
