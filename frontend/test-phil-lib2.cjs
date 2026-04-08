const ph = require('phil-reg-prov-mun-brgy');

console.log('Testing exact matching:\n');

// Test 1: Find CITY OF MEYCAUAYAN explicitly
const meycauayan = ph.city_mun.find(c => c.mun_code === '031412');
console.log('1. CITY OF MEYCAUAYAN (031412):');
console.log(`   Found: ${meycauayan ? 'YES' : 'NO'}`);
if (meycauayan) {
  console.log(`   Name: "${meycauayan.name}"`);
  console.log(`   Code: ${meycauayan.mun_code}`);
}

// Test 2: Check barangay Lawa
console.log('\n2. Barangay "Lawa" in Meycauayan:');
const lawaBrgy = ph.barangays.find(b =>
  b.mun_code === '031412' &&
  b.name.toUpperCase() === 'LAWA'
);
console.log(`   Found: ${lawaBrgy ? 'YES' : 'NO'}`);
if (lawaBrgy) {
  console.log(`   Name: "${lawaBrgy.name}"`);
  console.log(`   Code: ${lawaBrgy.brgy_code}`);
  console.log(`   Mun Code: ${lawaBrgy.mun_code}`);
}

// Test 3: Show why matching failed
console.log('\n3. Testing "Meycauayan City" matching:');
const testName = 'Meycauayan City';

console.log(`\n   Searching with: c.name.toUpperCase().includes("${testName.toUpperCase()}")`);
const wrongMatch = ph.city_mun.find(c =>
  c.name.toUpperCase().includes(testName.toUpperCase())
);
if (wrongMatch) {
  console.log(`   ❌ WRONG: Found "${wrongMatch.name}" (${wrongMatch.mun_code})`);
  console.log(`      Because "CAUAYAN" is contained in "MEYCAUAYAN CITY"`);
}

console.log(`\n   Searching with: "${testName.toUpperCase()}".includes(c.name.toUpperCase())`);
const cities = [];
ph.city_mun.forEach(c => {
  if (testName.toUpperCase().includes(c.name.toUpperCase())) {
    cities.push(`${c.name} (${c.mun_code})`);
  }
});
console.log(`   Found ${cities.length} matches: ${cities.join(', ')}`);

// Test 4: Correct matching
console.log('\n4. Correct matching approach:');
console.log(`   "Meycauayan City" should match "CITY OF MEYCAUAYAN"`);
console.log(`   Need to remove "CITY" and match the core name`);

const cleanName = testName.toUpperCase().replace(/^CITY\s+OF\s+/i, '').replace(/\s+CITY$/i, '');
console.log(`   Cleaned: "${cleanName}"`);

const correctMatch = ph.city_mun.find(c => {
  const cleanLibName = c.name.toUpperCase().replace(/^CITY\s+OF\s+/i, '');
  return cleanLibName === cleanName || cleanLibName.includes(cleanName);
});
if (correctMatch) {
  console.log(`   ✅ CORRECT: Found "${correctMatch.name}" (${correctMatch.mun_code})`);
}
