import { useEffect, useState } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldValues, FieldErrors, Path, PathValue } from 'react-hook-form';
import Combobox from '@/components/Custom/Combobox';
import ph from 'phil-reg-prov-mun-brgy';
import { getZipByMunCode } from '@/data/ph-zipcodes';
import { Region, Province, CityMunicipality, Barangay } from '@/types/ph-address';

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

  // Ensure fields are registered for watch to trigger re-renders
  useEffect(() => {
      register(`${prefix}Region` as Path<T>);
      register(`${prefix}Province` as Path<T>);
      register(`${prefix}City` as Path<T>);
      register(`${prefix}Brgy` as Path<T>);
  }, [register, prefix]);

  // 1. Load Regions initially
  useEffect(() => {
    if (isMeycauayanOnly) {
      const reg3 = ph.regions.find((r: Region) => r.reg_code === '03');
      setRegions(reg3 ? [reg3] : []);
      setValue(`${prefix}Region` as Path<T>, '03' as PathValue<T, Path<T>>, { shouldValidate: true });

      const bulacan = ph.provinces.find((p: Province) => p.prov_code === '0314');
      setProvinces(bulacan ? [bulacan] : []);
      setValue(`${prefix}Province` as Path<T>, '0314' as PathValue<T, Path<T>>, { shouldValidate: true });

      const meycauayan = ph.city_mun.find((c: CityMunicipality) => c.mun_code === '031412' || c.name.toUpperCase().includes('MEYCAUAYAN'));
      setCities(meycauayan ? [meycauayan] : []);
      const munCode = meycauayan?.mun_code || '031412';
      setValue(`${prefix}City` as Path<T>, munCode as PathValue<T, Path<T>>, { shouldValidate: true });

      // Auto-set zip for Meycauayan using direct munCode lookup
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
      if (ph && Array.isArray(ph.provinces)) {
        setProvinces(ph.provinces.filter((p: Province) => p.reg_code === watchRegion) || []);
      }
      if (watchRegion === '13' && ph && Array.isArray(ph.city_mun)) {
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
      if (ph && Array.isArray(ph.city_mun)) {
        setCities(ph.city_mun.filter((c: CityMunicipality) => c.prov_code === watchProvince) || []);
      }
    } else if (watchRegion !== '13') {
      setCities([]);
    }
  }, [watchProvince, watchRegion, isMeycauayanOnly]);

  // 4. Load Barangays + Auto Zip Code when City changes
  useEffect(() => {
    if (watchCity) {
      if (ph && Array.isArray(ph.barangays)) {
        setBarangays(ph.barangays.filter((b: Barangay) => b.mun_code === watchCity) || []);
      }

      // Direct munCode → zip code lookup (100% coverage, no string matching)
      const zip = getZipByMunCode(String(watchCity));
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Region */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Region</label>
          <Combobox 
             options={regions.map((r: Region) => ({ value: r.reg_code, label: formatName(r.name) }))}
             value={watchRegion || ''}
             onChange={(val: string) => {
                 setValue(`${prefix}Region` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true });
                 setValue(`${prefix}Province` as Path<T>, '' as PathValue<T, Path<T>>);
                 setValue(`${prefix}City` as Path<T>, '' as PathValue<T, Path<T>>);
                 setValue(`${prefix}Brgy` as Path<T>, '' as PathValue<T, Path<T>>);
             }}
             placeholder="Select region"
             className={isMeycauayanOnly ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Region`]}
             buttonClassName={errors[`${prefix}Region`] ? "!border-red-500 ring-2 ring-red-100" : ""}
          />
          <FieldError name={`${prefix}Region`} />
        </div>

        {/* Province */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Province</label>
          <Combobox 
             options={provinces.map((p: Province) => ({ value: p.prov_code, label: formatName(p.name) }))}
             value={watchProvince || ''}
             onChange={(val: string) => {
                 setValue(`${prefix}Province` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true });
                 setValue(`${prefix}City` as Path<T>, '' as PathValue<T, Path<T>>);
                 setValue(`${prefix}Brgy` as Path<T>, '' as PathValue<T, Path<T>>);
             }}
             placeholder="Select province"
             className={isMeycauayanOnly || (!watchRegion && watchRegion !== '13') ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Province`]}
             buttonClassName={errors[`${prefix}Province`] ? "!border-red-500 ring-2 ring-red-100" : ""}
          />
          <FieldError name={`${prefix}Province`} />
        </div>

        {/* City/Municipality */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">City/municipality <span className="text-red-500">*</span></label>
          <Combobox 
             options={cities.map((c: CityMunicipality) => ({ value: c.mun_code, label: formatName(c.name) }))}
             value={watchCity || ''}
             onChange={(val: string) => {
                 setValue(`${prefix}City` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true });
                 setValue(`${prefix}Brgy` as Path<T>, '' as PathValue<T, Path<T>>);
             }}
             placeholder="Select city"
             className={isMeycauayanOnly || (!watchProvince && watchRegion !== '13') ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}City`] as boolean}
             buttonClassName={errors[`${prefix}City`] ? "!border-red-500 ring-2 ring-red-100" : ""}
          />
          <FieldError name={`${prefix}City`} />
        </div>

        {/* Barangay */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Barangay <span className="text-red-500">*</span></label>
          <Combobox 
             options={barangays.map((b: Barangay) => ({ value: b.name, label: formatName(b.name) }))}
             value={watchBrgy || ''}
             onChange={(val: string) => setValue(`${prefix}Brgy` as Path<T>, val as PathValue<T, Path<T>>, { shouldValidate: true })}
             placeholder="Select barangay"
             className={!watchCity ? 'opacity-60 pointer-events-none' : ''}
             error={!!errors[`${prefix}Brgy`] as boolean}
             buttonClassName={errors[`${prefix}Brgy`] ? "!border-red-500 ring-2 ring-red-100" : ""}
          />
          <FieldError name={`${prefix}Brgy`} />
        </div>
      </div>

      {/* Atomic Address Details: House/Block/Lot and Subdivision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">House/Block/Lot No.</label>
          <input 
             {...register(`${prefix}HouseBlockLot` as Path<T>)} 
             className={`${inputClass} ${getErrorClass(`${prefix}HouseBlockLot`)} !pl-3`} 
             placeholder="e.g. Lot 1 Block 2" 
          />
          <FieldError name={`${prefix}HouseBlockLot`} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Subdivision/Village</label>
          <input 
             {...register(`${prefix}Subdivision` as Path<T>)} 
             className={`${inputClass} ${getErrorClass(`${prefix}Subdivision`)} !pl-3`} 
             placeholder="e.g. Green Village" 
          />
          <FieldError name={`${prefix}Subdivision`} />
        </div>
      </div>

      {/* Street / Exact Address Box & Zip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Street</label>
          <input 
             {...register(`${prefix}Street` as Path<T>)} 
             className={`${inputClass} ${getErrorClass(`${prefix}Street`)} !pl-3`} 
             placeholder="e.g. Rizal Street" 
          />
          <FieldError name={`${prefix}Street`} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 ml-1">Zip code</label>
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
