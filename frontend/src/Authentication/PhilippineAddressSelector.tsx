import { useEffect, useState } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldValues, FieldErrors, Path, PathValue } from 'react-hook-form';
import Combobox from '@/components/Custom/Combobox';
// @ts-ignore
import phModule from 'phil-reg-prov-mun-brgy';
import { getZipByMunCode } from '@/data/ph-zipcodes';

const ph = phModule.default || phModule;

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
  const watchRegion = watch(`${prefix}Region` as Path<T>);
  const watchProvince = watch(`${prefix}Province` as Path<T>);
  const watchCity = watch(`${prefix}City` as Path<T>);
  const watchBrgy = watch(`${prefix}Brgy` as Path<T>);

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<CityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const zipField = (prefix === 'res' ? 'residentialZipCode' : 'permanentZipCode') as Path<T>;

  // 1. Load Regions initially
  useEffect(() => {
    if (isMeycauayanOnly) {
      const reg3 = ph.regions.find((r: Region) => r.reg_code === '03');
      setRegions(reg3 ? [reg3] : []);
      setValue(`${prefix}Region` as Path<T>, '03' as PathValue<T, Path<T>>, { shouldValidate: true });

      const bulacan = ph.provinces.find((p: Province) => p.prov_code === '0314');
      setProvinces(bulacan ? [bulacan] : []);
      setValue(`${prefix}Province` as Path<T>, '0314' as PathValue<T, Path<T>>, { shouldValidate: true });

      const meycauayan = ph.city_mun.find((c: CityMunicipality) => c.mun_code === '031412' || c.name.includes('MEYCAUAYAN'));
      setCities(meycauayan ? [meycauayan] : []);
      const munCode = meycauayan?.mun_code || '031412';
      setValue(`${prefix}City` as Path<T>, munCode as PathValue<T, Path<T>>, { shouldValidate: true });

      // Auto-set zip for Meycauayan using direct mun_code lookup
      const zip = getZipByMunCode(munCode);
      if (zip) {
        setValue(zipField, zip as PathValue<T, Path<T>>, { shouldValidate: true });
      }
    } else {
      setRegions(ph.regions || []);
    }
  }, [isMeycauayanOnly, prefix, setValue, zipField]);

  // 2. Load Provinces when Region changes
  useEffect(() => {
    if (isMeycauayanOnly) return;
    if (watchRegion) {
      setProvinces(ph.getProvincesByRegion(watchRegion) || []);
      if (watchRegion === '13') {
         setCities(ph.city_mun.filter((c: CityMunicipality) => c.reg_code === '13') || []);
      }
    } else {
      setProvinces([]);
    }
  }, [watchRegion, isMeycauayanOnly]);

  // 3. Load Cities when Province changes
  useEffect(() => {
    if (isMeycauayanOnly) return;
    if (watchProvince) {
      setCities(ph.getCityMunByProvince(watchProvince) || []);
    } else if (watchRegion !== '13') {
      setCities([]);
    }
  }, [watchProvince, watchRegion, isMeycauayanOnly]);

  // 4. Load Barangays + Auto Zip Code when City changes
  useEffect(() => {
    if (watchCity) {
      setBarangays(ph.getBarangayByMun(watchCity) || []);
      
      // Direct mun_code → zip code lookup (100% coverage, no string matching)
      const zip = getZipByMunCode(String(watchCity));
      if (zip) {
        setValue(zipField, zip as PathValue<T, Path<T>>, { shouldValidate: true });
      }
    } else {
      setBarangays([]);
    }
  }, [watchCity, prefix, setValue, zipField]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Region */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Region</label>
          <Combobox 
             options={regions.map((r: Region) => ({ value: r.reg_code, label: r.name }))}
             value={watchRegion || ''}
             onChange={(val: string) => setValue(`${prefix}Region` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true })}
             placeholder="Select Region"
             className={isMeycauayanOnly ? 'opacity-60 pointer-events-none' : ''}
          />
        </div>

        {/* Province */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Province</label>
          <Combobox 
             options={provinces.map((p: Province) => ({ value: p.prov_code, label: p.name }))}
             value={watchProvince || ''}
             onChange={(val: string) => setValue(`${prefix}Province` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true })}
             placeholder="Select Province"
             className={isMeycauayanOnly || (!watchRegion && watchRegion !== '13') ? 'opacity-60 pointer-events-none' : ''}
          />
        </div>

        {/* City/Municipality */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">City/Municipality <span className="text-red-500">*</span></label>
          <Combobox 
             options={cities.map((c: CityMunicipality) => ({ value: c.mun_code, label: c.name }))}
             value={watchCity || ''}
             onChange={(val: string) => setValue(`${prefix}City` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true })}
             placeholder="Select City"
             className={isMeycauayanOnly || (!watchProvince && watchRegion !== '13') ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}City`]}
          />
        </div>

        {/* Barangay */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Barangay <span className="text-red-500">*</span></label>
          <Combobox 
             options={barangays.map((b: Barangay) => ({ value: b.name, label: b.name }))}
             value={watchBrgy || ''}
             onChange={(val: string) => setValue(`${prefix}Brgy` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true })}
             placeholder="Select Barangay"
             className={!watchCity ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Brgy`]}
          />
        </div>
      </div>

      {/* Street / Exact Address Box & Zip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Street / House No.</label>
          <input 
             {...register(`${prefix}Street` as Path<T>)} 
             className={`${inputClass} !pl-3`} 
             placeholder="House No., Street Name, Phase, Subdivision..." 
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Zip Code</label>
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
