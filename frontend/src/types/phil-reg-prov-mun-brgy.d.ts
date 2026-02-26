declare module 'phil-reg-prov-mun-brgy' {
  export interface Region {
    reg_code: string;
    name: string;
  }
  export interface Province {
    prov_code: string;
    reg_code: string;
    name: string;
  }
  export interface CityMunicipality {
    mun_code: string;
    prov_code: string;
    name: string;
  }
  export interface Barangay {
    name: string;
    mun_code: string;
  }

  const ph: {
    regions: Region[];
    provinces: Province[];
    city_mun: CityMunicipality[];
    barangays: Barangay[];
  };

  export default ph;
}
