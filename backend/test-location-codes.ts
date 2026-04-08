import ph from 'phil-reg-prov-mun-brgy';

type Region = { reg_code: string; name: string };
type Province = { prov_code: string; name: string; reg_code: string };
type CityMunicipality = { mun_code: string; name: string; prov_code: string };
type Barangay = { brgy_code: string; name: string; mun_code: string };

type PHLibrary = {
  regions: Region[];
  provinces: Province[];
  city_mun: CityMunicipality[];
  barangays: Barangay[];
};

const phLib = ph as PHLibrary;

// Test the conversion functions
const getRegionCodeByName = (name: string | null): string => {
  if (!name) return '';
  console.log(`\nSearching for region: "${name}"`);

  const region = phLib.regions.find(r => {
    const match = r.name.toUpperCase() === name.toUpperCase() ||
                  name.toUpperCase().includes(r.name.toUpperCase());
    if (match) {
      console.log(`  ✅ Found match: ${r.reg_code} - ${r.name}`);
    }
    return match;
  });

  if (!region) {
    console.log(`  ❌ No match found`);
    console.log(`  Available regions:`);
    phLib.regions.slice(0, 5).forEach(r => console.log(`    - ${r.reg_code}: ${r.name}`));
  }

  return region?.reg_code || '';
};

const getProvinceCodeByName = (name: string | null): string => {
  if (!name) return '';
  console.log(`\nSearching for province: "${name}"`);

  const province = phLib.provinces.find(p => {
    const match = p.name.toUpperCase() === name.toUpperCase() ||
                  name.toUpperCase().includes(p.name.toUpperCase());
    if (match) {
      console.log(`  ✅ Found match: ${p.prov_code} - ${p.name}`);
    }
    return match;
  });

  if (!province) {
    console.log(`  ❌ No match found`);
    console.log(`  Sample provinces:`);
    phLib.provinces.filter(p => p.name.toUpperCase().includes('BULACAN')).forEach(p =>
      console.log(`    - ${p.prov_code}: ${p.name}`)
    );
  }

  return province?.prov_code || '';
};

const getCityCodeByName = (name: string | null): string => {
  if (!name) return '';
  console.log(`\nSearching for city: "${name}"`);

  const city = phLib.city_mun.find(c => {
    const match = c.name.toUpperCase() === name.toUpperCase() ||
                  name.toUpperCase().includes(c.name.toUpperCase()) ||
                  c.name.toUpperCase().includes(name.toUpperCase());
    if (match) {
      console.log(`  ✅ Found match: ${c.mun_code} - ${c.name}`);
    }
    return match;
  });

  if (!city) {
    console.log(`  ❌ No match found`);
    console.log(`  Cities containing 'MEYCAUAYAN':`);
    phLib.city_mun.filter(c => c.name.toUpperCase().includes('MEYCAUAYAN')).forEach(c =>
      console.log(`    - ${c.mun_code}: ${c.name}`)
    );
  }

  return city?.mun_code || '';
};

const getBarangayCodeByName = (name: string | null, cityCode: string): string => {
  if (!name || !cityCode) {
    console.log(`\nSearching for barangay: "${name}" in city code: "${cityCode}"`);
    console.log(`  ❌ Missing name or city code`);
    return '';
  }

  console.log(`\nSearching for barangay: "${name}" in city code: "${cityCode}"`);

  const barangay = phLib.barangays.find(b => {
    const match = b.mun_code === cityCode &&
                  (b.name.toUpperCase() === name.toUpperCase() ||
                   name.toUpperCase().includes(b.name.toUpperCase()));
    if (match) {
      console.log(`  ✅ Found match: ${b.brgy_code} - ${b.name}`);
    }
    return match;
  });

  if (!barangay) {
    console.log(`  ❌ No match found`);
    const barangaysInCity = phLib.barangays.filter(b => b.mun_code === cityCode);
    console.log(`  Found ${barangaysInCity.length} barangays in city ${cityCode}`);
    const lawaBrgy = barangaysInCity.filter(b => b.name.toUpperCase().includes('LAWA'));
    if (lawaBrgy.length > 0) {
      console.log(`  Barangays containing 'LAWA':`);
      lawaBrgy.forEach(b => console.log(`    - ${b.brgy_code}: ${b.name}`));
    } else {
      console.log(`  Sample barangays in this city:`);
      barangaysInCity.slice(0, 5).forEach(b => console.log(`    - ${b.brgy_code}: ${b.name}`));
    }
  }

  return barangay?.brgy_code || '';
};

// Test with Joshua's actual data
console.log('='.repeat(80));
console.log('Testing Location Code Conversion with Joshua\'s Data');
console.log('='.repeat(80));

const regionCode = getRegionCodeByName('Region III (Central Luzon)');
const provinceCode = getProvinceCodeByName('Bulacan');
const cityCode = getCityCodeByName('Meycauayan City');
const barangayCode = getBarangayCodeByName('Lawa', cityCode);

console.log('\n' + '='.repeat(80));
console.log('RESULTS:');
console.log('='.repeat(80));
console.log(`Region Code: "${regionCode}" ${regionCode ? '✅' : '❌'}`);
console.log(`Province Code: "${provinceCode}" ${provinceCode ? '✅' : '❌'}`);
console.log(`City Code: "${cityCode}" ${cityCode ? '✅' : '❌'}`);
console.log(`Barangay Code: "${barangayCode}" ${barangayCode ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(80));
if (regionCode && provinceCode && cityCode && barangayCode) {
  console.log('✅ ALL CODES FOUND - Helper functions are working!');
} else {
  console.log('❌ SOME CODES NOT FOUND - Need to fix the helper functions');
}
console.log('='.repeat(80));
