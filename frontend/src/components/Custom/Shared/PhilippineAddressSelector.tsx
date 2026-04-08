import { useEffect, useState } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldValues, FieldErrors, Path, PathValue } from 'react-hook-form';
import Combobox from '@/components/Custom/Combobox';
import ph from 'phil-reg-prov-mun-brgy';
import { getZipByMunCode } from '@/data/ph-zipcodes';
import { Region, Province, CityMunicipality, Barangay, PhilAddressLibrary } from '@/types/ph-address';

interface AddressSelectorProps<T extends FieldValues> {
  prefix: 'res' | 'perm';
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  inputClass: string;
  isMeycauayanOnly?: boolean;
}

export const PhilippineAddressSelector = <T extends FieldValues>({
  prefix,
  register,
  watch,
  setValue,
  errors,
  inputClass,
  isMeycauayanOnly = false
}: AddressSelectorProps<T>) => {
  const phLib = ph as unknown as PhilAddressLibrary;
  const watchRegion = watch(`${prefix}Region` as Path<T>);
  const watchProvince = watch(`${prefix}Province` as Path<T>);
  const watchCity = watch(`${prefix}City` as Path<T>);
  const watchBarangay = watch(`${prefix}Barangay` as Path<T>);

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<CityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const zipField = (prefix === 'res' ? 'zipCode' : 'permanentZipCode') as Path<T>;

  // Ensure fields are registered for watch to trigger re-renders
  useEffect(() => {
      register(`${prefix}Region` as Path<T>);
      register(`${prefix}Province` as Path<T>);
      register(`${prefix}City` as Path<T>);
      register(`${prefix}Barangay` as Path<T>);
  }, [register, prefix]);

  // Verify data is loaded
  useEffect(() => {
    const dataStatus = {
      regions: phLib.regions?.length || 0,
      provinces: phLib.provinces?.length || 0,
      cities: phLib.city_mun?.length || 0,
      barangays: phLib.barangays?.length || 0
    };

    const loaded = dataStatus.regions > 0 && dataStatus.provinces > 0 &&
                  dataStatus.cities > 0 && dataStatus.barangays > 0;
    setIsDataLoaded(loaded);
  }, []);

  // 1. Load Regions initially
  useEffect(() => {
    if (isMeycauayanOnly) {
      const reg3 = phLib.regions.find((r: Region) => r.reg_code === '03');
      setRegions(reg3 ? [reg3] : []);
      setValue(`${prefix}Region` as Path<T>, '03' as PathValue<T, Path<T>>, { shouldValidate: true });

      const bulacan = phLib.provinces.find((p: Province) => p.prov_code === '0314');
      setProvinces(bulacan ? [bulacan] : []);
      setValue(`${prefix}Province` as Path<T>, '0314' as PathValue<T, Path<T>>, { shouldValidate: true });

      const meycauayan = phLib.city_mun.find((c: CityMunicipality) => c.mun_code === '031412' || c.name.toUpperCase().includes('MEYCAUAYAN'));
      setCities(meycauayan ? [meycauayan] : []);
      const munCode = meycauayan?.mun_code || '031412';
      setValue(`${prefix}City` as Path<T>, munCode as PathValue<T, Path<T>>, { shouldValidate: true });

      const zip = getZipByMunCode(munCode);
      if (zip) {
        setValue(zipField, zip as PathValue<T, Path<T>>, { shouldValidate: true });
      }
    } else {
      setRegions(phLib.regions || []);
    }
  }, [isMeycauayanOnly, prefix, setValue, zipField]);

  // 2. Load Provinces when Region changes
  useEffect(() => {
    if (isMeycauayanOnly) return;

    if (watchRegion) {
      const filteredProvinces = phLib.getProvincesByRegion?.(watchRegion) ||
                               phLib.provinces?.filter((p: Province) => p.reg_code === watchRegion) || [];
      setProvinces(filteredProvinces);

      // For NCR (Region 13), load cities directly
      if (watchRegion === '13') {
        const filteredCities = phLib.city_mun?.filter((c: CityMunicipality) => c.reg_code === '13') || [];
        setCities(filteredCities);
      }
    } else {
      setProvinces([]);
    }
  }, [watchRegion, isMeycauayanOnly]);

  // 3. Load Cities when Province changes
  useEffect(() => {
    if (isMeycauayanOnly) return;

    if (watchProvince) {
      const filteredCities = phLib.getCityMunByProvince?.(watchProvince) ||
                            phLib.city_mun?.filter((c: CityMunicipality) => c.prov_code === watchProvince) || [];
      setCities(filteredCities);
    } else if (watchRegion !== '13') {
      setCities([]);
    }
  }, [watchProvince, watchRegion, isMeycauayanOnly]);

  // 4. Load Barangays + Auto Zip Code when City changes
  useEffect(() => {
    if (watchCity) {
      let filteredBarangays: Barangay[] = [];
      const cityCode = String(watchCity);

      if (phLib.getBarangayByMun) {
        filteredBarangays = phLib.getBarangayByMun(cityCode) || [];
      } else if (phLib.barangays) {
        filteredBarangays = phLib.barangays.filter((b: Barangay) => b.mun_code === cityCode) || [];
      }

      setBarangays(filteredBarangays);

      // Direct munCode → zip code lookup (100% coverage, no string matching)
      const zip = getZipByMunCode(cityCode);
      if (zip) {
        setValue(zipField, zip as PathValue<T, Path<T>>, { shouldValidate: true });
      }
    } else {
      setBarangays([]);
    }
  }, [watchCity, prefix, setValue, zipField]);

  // Helper to format names to Normal/Title Case
  const formatName = (name: string) => {
    if (!name) return '';
    const upper = name.toUpperCase();
    
    // Special handling for common abbreviations that should stay uppercase
    const specifics = ['NCR', 'CAR', 'BARMM', 'IV-A', 'IV-B', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
    
    return upper.split(' ').map(word => {
      if (!word) return '';
      
      // Clean word for comparison (removing surrounding parentheses)
      const cleanWord = word.replace(/^\(|\)$/g, '');
      
      if (specifics.includes(cleanWord)) return word; // Keep the whole word (including parens) as is
      
      const lowerWord = word.toLowerCase();
      if (lowerWord === 'of' || lowerWord === 'de' || lowerWord === 'del') return lowerWord;
      
      // Handle Title Case for normal words, potentially with leading paren
      if (word.startsWith('(')) {
        return '(' + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const FieldError = ({ name }: { name: string }) => {
      const error = errors[name];
      if (!error) return null;
      return <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{error.message as string}</p>;
  };

  const getErrorClass = (name: string) => {
      return errors[name] ? "!border-red-500 ring-2 ring-red-100 bg-red-50/10" : "";
  };

  return (
    <div className="space-y-3">
      {!isDataLoaded && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-yellow-800">
            ⚠️ Loading address data... If this persists, please refresh the page.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
        {/* Region */}
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Region</label>
          <Combobox 
             options={regions.map((r: Region) => ({ value: r.reg_code, label: formatName(r.name) }))}
             value={watchRegion || ''}
             onChange={(val: string) => {
                 setValue(`${prefix}Region` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true });
                 setValue(`${prefix}Province` as Path<T>, '' as PathValue<T, Path<T>>);
                 setValue(`${prefix}City` as Path<T>, '' as PathValue<T, Path<T>>);
                 setValue(`${prefix}Barangay` as Path<T>, '' as PathValue<T, Path<T>>);
             }}
             placeholder="Select region"
             className={isMeycauayanOnly ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Region`]}
             buttonClassName="rounded-[12px]"
          />
          <FieldError name={`${prefix}Region`} />
        </div>

        {/* Province */}
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Province</label>
          <Combobox
             options={provinces.map((p: Province) => ({ value: p.prov_code, label: formatName(p.name) }))}
             value={watchProvince || ''}
             onChange={(val: string) => {
                 setValue(`${prefix}Province` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true });
                 setValue(`${prefix}City` as Path<T>, '' as PathValue<T, Path<T>>);
                 setValue(`${prefix}Barangay` as Path<T>, '' as PathValue<T, Path<T>>);
             }}
             placeholder={!watchRegion ? "Select region first" : provinces.length === 0 ? "No provinces available" : "Select province"}
             className={isMeycauayanOnly || (!watchRegion && watchRegion !== '13') ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Province`]}
             buttonClassName="rounded-[12px]"
          />
          <FieldError name={`${prefix}Province`} />
          {watchRegion && provinces.length === 0 && (
            <p className="text-orange-600 text-xs ml-1 font-semibold">⚠️ No provinces found for this region</p>
          )}
        </div>

        {/* City/Municipality */}
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">City/Municipality <span className="text-red-500">*</span></label>
          <Combobox
             options={cities.map((c: CityMunicipality) => ({ value: c.mun_code, label: formatName(c.name) }))}
             value={watchCity || ''}
             onChange={(val: string) => {
                 setValue(`${prefix}City` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true });
                 setValue(`${prefix}Barangay` as Path<T>, '' as PathValue<T, Path<T>>);
             }}
             placeholder={!watchProvince && watchRegion !== '13' ? "Select province first" : cities.length === 0 ? "No cities available" : "Select city"}
             className={isMeycauayanOnly || (!watchProvince && watchRegion !== '13') ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}City`] as boolean}
             buttonClassName="rounded-[12px]"
          />
          <FieldError name={`${prefix}City`} />
          {(watchProvince || watchRegion === '13') && cities.length === 0 && (
            <p className="text-orange-600 text-xs ml-1 font-semibold">⚠️ No cities found for this province</p>
          )}
        </div>

        {/* Barangay */}
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Barangay <span className="text-red-500">*</span></label>
          <Combobox
             options={barangays.map((b: Barangay) => ({ value: b.name, label: formatName(b.name) }))}
             value={watchBarangay || ''}
             onChange={(val: string) => setValue(`${prefix}Barangay` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true })}
             placeholder={!watchCity ? "Select city first" : barangays.length === 0 ? "No barangays available" : "Select barangay"}
             className={!watchCity ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Barangay`] as boolean}
             buttonClassName="rounded-[12px]"
          />
          <FieldError name={`${prefix}Barangay`} />
          {watchCity && barangays.length === 0 && (
            <p className="text-orange-600 text-xs ml-1 font-semibold">⚠️ No barangays found for this city</p>
          )}
        </div>
      </div>

      {/* Atomic Address Details: House/Block/Lot and Subdivision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">House/Block/Lot No.</label>
          <input 
             {...register(`${prefix}HouseBlockLot` as Path<T>)} 
             className={`${inputClass} !pl-3 ${getErrorClass(`${prefix}HouseBlockLot`)} !pl-3`} 
             placeholder="e.g. Lot 1 Block 2" 
          />
          <FieldError name={`${prefix}HouseBlockLot`} />
        </div>
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Subdivision/Village</label>
          <input 
             {...register(`${prefix}Subdivision` as Path<T>)} 
             className={`${inputClass} !pl-3 ${getErrorClass(`${prefix}Subdivision`)} !pl-3`} 
             placeholder="e.g. Green Village" 
          />
          <FieldError name={`${prefix}Subdivision`} />
        </div>
      </div>

      {/* Street / Exact Address Box & Zip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Street</label>
          <input 
             {...register(`${prefix}Street` as Path<T>)} 
             className={`${inputClass} !pl-3 ${getErrorClass(`${prefix}Street`)} !pl-3`} 
             placeholder="e.g. Rizal Street" 
          />
          <FieldError name={`${prefix}Street`} />
        </div>
        <div className="space-y-2 md:space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Zip Code</label>
          <input 
            {...register(zipField)} 
            className={`${inputClass} !pl-3 bg-gray-100/50 cursor-not-allowed`} 
            readOnly
            placeholder="Auto-populated"
          />
        </div>
      </div>
    </div>
  );
};
