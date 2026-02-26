declare module 'phil-reg-prov-mun-brgy' {
  import { PhilAddressLibrary } from './ph-address';
  const ph: PhilAddressLibrary;
  export default ph;
}

declare module 'zipcodes-ph' {
  interface ZipcodesLibrary {
    find(zipcode: string): string | string[] | null;
    reverse(location: string): string | null;
  }
  const zipcodes: ZipcodesLibrary;
  export default zipcodes;
}
