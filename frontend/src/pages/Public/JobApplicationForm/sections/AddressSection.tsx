import React, { useState } from "react";
import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";
import { PhilippineAddressSelector } from "@/components/Custom/Shared/PhilippineAddressSelector";

interface AddressSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  watch: UseFormWatch<JobApplicationSchema>;
  setValue: UseFormSetValue<JobApplicationSchema>;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  register,
  errors,
  watch,
  setValue,
}) => {
  const [sameAsResidential, setSameAsResidential] = useState(false);

  const inputClass =
    "w-full border-2 border-gray-300 focus:ring-4 focus:ring-slate-100 focus:border-slate-500 rounded-lg px-4 py-3 md:py-2.5 text-[15px] md:text-sm focus:outline-none transition-all bg-white text-slate-900 placeholder:text-gray-400 font-medium hover:border-gray-400 min-h-[48px] md:min-h-[44px]";

  const handleSameAsResidential = (checked: boolean) => {
    setSameAsResidential(checked);

    if (checked) {
      // Copy all residential address fields to permanent
      const resRegion = watch("resRegion");
      const resProvince = watch("resProvince");
      const resCity = watch("resCity");
      const resBarangay = watch("resBarangay");
      const resHouseBlockLot = watch("resHouseBlockLot");
      const resStreet = watch("resStreet");
      const resSubdivision = watch("resSubdivision");
      const zipCode = watch("zipCode");

      setValue("permRegion", resRegion);
      setValue("permProvince", resProvince);
      setValue("permCity", resCity);
      setValue("permBarangay", resBarangay);
      setValue("permHouseBlockLot", resHouseBlockLot);
      setValue("permStreet", resStreet);
      setValue("permSubdivision", resSubdivision);
      setValue("permanentZipCode", zipCode);
    } else {
      // Clear permanent address fields
      setValue("permRegion", "");
      setValue("permProvince", "");
      setValue("permCity", "");
      setValue("permBarangay", "");
      setValue("permHouseBlockLot", "");
      setValue("permStreet", "");
      setValue("permSubdivision", "");
      setValue("permanentZipCode", "");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
          Address Information
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          Provide your residential and permanent address
        </p>
      </div>

      {/* Residential Address */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Residential Address
        </h4>

        <PhilippineAddressSelector
          prefix="res"
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          inputClass={inputClass}
          isMeycauayanOnly={false}
        />
      </div>

      {/* Permanent Address */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Permanent Address
          </h4>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAsResidential}
              onChange={(e) => handleSameAsResidential(e.target.checked)}
              className="w-4 h-4 text-slate-600 focus:ring-slate-500 rounded"
            />
            <span className="text-xs font-semibold text-slate-700">
              Same as residential address
            </span>
          </label>
        </div>

        {!sameAsResidential && (
          <PhilippineAddressSelector
            prefix="perm"
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            inputClass={inputClass}
            isMeycauayanOnly={false}
          />
        )}

        {sameAsResidential && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-700 font-semibold">
              Permanent address will be the same as your residential address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSection;
