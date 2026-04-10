const ph = require('phil-reg-prov-mun-brgy');
const phLib = ph;

const getProvinceCodeByName = (name) => {
  if (!name) return '';
  const province = phLib.provinces.find(p =>
    p.name.toUpperCase() === name.toUpperCase() ||
    name.toUpperCase().includes(p.name.toUpperCase())
  );
  return province?.prov_code || '';
};

const getCityCodeByName = (name) => {
  if (!name) return '';

  const normalizedSearch = name
    .toUpperCase()
    .replace(/^CITY\s+OF\s+/i, '')
    .replace(/\s+CITY$/i, '')
    .trim();

  const city = phLib.city_mun.find(c => {
    const normalizedLib = c.name
      .toUpperCase()
      .replace(/^CITY\s+OF\s+/i, '')
      .trim();

    return (
      c.name.toUpperCase() === name.toUpperCase() ||
      normalizedLib === normalizedSearch ||
      normalizedLib.includes(normalizedSearch)
    );
  });

  return city?.mun_code || '';
};

console.log(`Province "Bulacan": ${getProvinceCodeByName("Bulacan")}`);
console.log(`City "Meycauayan City": ${getCityCodeByName("Meycauayan City")}`);
