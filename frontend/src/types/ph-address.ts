export interface Region {
  name: string;
  reg_code: string;
}

export interface Province {
  name: string;
  reg_code: string;
  prov_code: string;
}

export interface CityMunicipality {
  name: string;
  prov_code: string;
  mun_code: string;
  reg_code?: string;
}

export interface Barangay {
  name: string;
  mun_code: string;
}

export interface PhilAddressLibrary {
  regions: Region[];
  provinces: Province[];
  city_mun: CityMunicipality[];
  barangays: Barangay[];
  getProvincesByRegion: (region_code: string) => Province[];
  getCityMunByProvince: (province_code: string) => CityMunicipality[];
  getBarangayByMun: (mun_code: string) => Barangay[];
  sort: (arr: any[], sort?: 'A' | 'Z') => any[]; // sort is generic but we'll try to be specific where used
}

export interface ZipcodesLibrary {
  find: (zipcode: string) => string | string[] | null;
  reverse: (location: string) => string | null;
}
