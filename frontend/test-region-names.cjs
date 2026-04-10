const ph = require('phil-reg-prov-mun-brgy');
const phLib = ph;

phLib.regions.forEach(r => {
  console.log(`Region Code: ${r.reg_code}, Name: "${r.name}"`);
});

const getRegionCodeByName = (name) => {
  if (!name) return '';
  const region = phLib.regions.find(r =>
    r.name.toUpperCase() === name.toUpperCase() ||
    name.toUpperCase().includes(r.name.toUpperCase())
  );
  return region?.reg_code || '';
};

const input = "Region III (Central Luzon)";
console.log(`Testing with input: "${input}"`);
console.log(`Result: "${getRegionCodeByName(input)}"`);
