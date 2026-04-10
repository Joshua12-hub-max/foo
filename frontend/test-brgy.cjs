const ph = require('phil-reg-prov-mun-brgy');
const phLib = ph;

const getBarangayNameByName = (name, cityCode) => {
  if (!name || !cityCode) return '';

  const barangay = phLib.barangays.find(b =>
    b.mun_code === cityCode &&
    (b.name.toUpperCase() === name.toUpperCase() ||
     b.name.toUpperCase().includes(name.toUpperCase()) ||
     name.toUpperCase().includes(b.name.toUpperCase()))
  );

  return barangay?.name || name;
};

console.log(`Barangay "Lawa" in "031412": "${getBarangayNameByName("Lawa", "031412")}"`);
