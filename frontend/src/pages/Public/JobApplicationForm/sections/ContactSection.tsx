import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";

interface ContactSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  setValue?: UseFormSetValue<JobApplicationSchema>;
}

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, "");

  // Limit to 11 digits
  const limited = cleaned.slice(0, 11);

  // Format as 09XX XXX XXXX
  if (limited.length <= 4) return limited;
  if (limited.length <= 7) return `${limited.slice(0, 4)} ${limited.slice(4)}`;
  return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
};

const ContactSection: React.FC<ContactSectionProps> = ({
  register,
  errors,
  setValue,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
          Contact Information
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          How can we reach you?
        </p>
      </div>

      {/* Primary Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register("email")}
            className={`w-full border ${errors.email ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="juan.delacruz@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register("phoneNumber", {
              onChange: (e) => {
                const formatted = formatPhoneNumber(e.target.value);
                if (setValue) setValue("phoneNumber", formatted);
              },
            })}
            className={`w-full border ${errors.phoneNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="0917 123 4567"
            maxLength={13}
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.phoneNumber.message}
            </p>
          )}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 09XX XXX XXXX
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
          Telephone Number (Optional)
        </label>
        <input
          type="tel"
          {...register("telephoneNumber")}
          className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
          placeholder="(02) 8123 4567"
        />
      </div>

      {/* Emergency Contact */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
          Emergency Contact
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              {...register("emergencyContact")}
              className={`w-full border ${errors.emergencyContact ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
              placeholder="Full Name"
            />
            {errors.emergencyContact && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.emergencyContact.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register("emergencyContactNumber", {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  if (setValue) setValue("emergencyContactNumber", formatted);
                },
              })}
              className={`w-full border ${errors.emergencyContactNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
              placeholder="0917 123 4567"
              maxLength={13}
            />
            {errors.emergencyContactNumber && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.emergencyContactNumber.message}
              </p>
            )}
            <p className="text-[10px] text-gray-500 mt-1 ml-1">
              Format: 09XX XXX XXXX
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Links (Optional) */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
          Social Media (Optional)
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Facebook Profile URL
            </label>
            <input
              type="url"
              {...register("facebookUrl")}
              className={`w-full border ${errors.facebookUrl ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
              placeholder="https://facebook.com/yourprofile"
            />
            {errors.facebookUrl && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.facebookUrl.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                {...register("linkedinUrl")}
                className={`w-full border ${errors.linkedinUrl ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {errors.linkedinUrl && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.linkedinUrl.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                Twitter Handle
              </label>
              <input
                type="text"
                {...register("twitterHandle")}
                className={`w-full border ${errors.twitterHandle ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                placeholder="@yourhandle"
                maxLength={16}
              />
              {errors.twitterHandle && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.twitterHandle.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
