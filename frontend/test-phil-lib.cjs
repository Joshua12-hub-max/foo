const ph = require('phil-reg-prov-mun-brgy');

console.log('='.repeat(80));
console.log('Checking phil-reg-prov-mun-brgy library data');
console.log('='.repeat(80));

console.log('\n1. Cities with MEYCAUAYAN:');
const meycauayanCities = ph.city_mun.filter(c =>
  c.name.toUpperCase().includes('MEYCAUAYAN')
);
meycauayanCities.forEach(c =>
  console.log(`  ${c.mun_code}: ${c.name} (Province: ${c.prov_code})`)
);

if (meycauayanCities.length > 0) {
  const meycauayan = meycauayanCities[0];
  console.log(`\n2. Barangays in ${meycauayan.name} (${meycauayan.mun_code}):`);

  const lawaBarangays = ph.barangays.filter(b =>
    b.mun_code === meycauayan.mun_code &&
    b.name.toUpperCase().includes('LAWA')
  );

  if (lawaBarangays.length > 0) {
    console.log('  Barangays containing LAWA:');
    lawaBarangays.forEach(b =>
      console.log(`    ${b.brgy_code}: ${b.name}`)
    );
  } else {
    console.log('  ❌ No barangays found with "LAWA"');
    console.log('  First 10 barangays in this city:');
    ph.barangays
      .filter(b => b.mun_code === meycauayan.mun_code)
      .slice(0, 10)
      .forEach(b => console.log(`    ${b.brgy_code}: ${b.name}`));
  }
}

console.log('\n3. Testing matching logic:');
const testCity = 'Meycauayan City';
const found = ph.city_mun.find(c =>
  c.name.toUpperCase() === testCity.toUpperCase() ||
  testCity.toUpperCase().includes(c.name.toUpperCase()) ||
  c.name.toUpperCase().includes(testCity.toUpperCase())
);

if (found) {
  console.log(`  ✅ Found match for "${testCity}": ${found.mun_code} - ${found.name}`);
} else {
  console.log(`  ❌ No match found for "${testCity}"`);
}

console.log('\n4. Testing Region III:');
const region3 = ph.regions.find(r =>
  r.name.toUpperCase().includes('REGION III') ||
  r.name.toUpperCase().includes('CENTRAL LUZON')
);
if (region3) {
  console.log(`  ✅ Found: ${region3.reg_code} - ${region3.name}`);
} else {
  console.log('  ❌ Not found');
}

console.log('\n5. Testing Bulacan:');
const bulacan = ph.provinces.find(p =>
  p.name.toUpperCase() === 'BULACAN'
);
if (bulacan) {
  console.log(`  ✅ Found: ${bulacan.prov_code} - ${bulacan.name}`);
} else {
  console.log('  ❌ Not found');
}

console.log('\n' + '='.repeat(80));
