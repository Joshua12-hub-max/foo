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

export interface PhilAddressData {
  regions: Region[];
  provinces: Province[];
  city_mun: CityMunicipality[];
  barangays: Barangay[];
}

export interface PhilAddressLibrary extends PhilAddressData {
  getProvincesByRegion: (regionCode: string) => Province[];
  getCityMunByProvince: (provinceCode: string) => CityMunicipality[];
  getBarangayByMun: (munCode: string) => Barangay[];
  sort: (arr: Record<string, unknown>[], sort?: 'A' | 'Z') => Record<string, unknown>[];
}

export interface ZipcodesLibrary {
  find: (zipcode: string) => string | string[] | null;
  reverse: (location: string) => string | null;
}
