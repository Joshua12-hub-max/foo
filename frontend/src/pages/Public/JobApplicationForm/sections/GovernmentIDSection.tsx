import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";
import {
  formatGSIS,
  formatPagIBIG,
  formatPhilHealth,
  formatUMID,
  formatPhilSys,
  formatTIN,
} from "../utils/fieldValidation";
interface GovernmentIDSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  setValue: UseFormSetValue<JobApplicationSchema>;
}
const GovernmentIDSection: React.FC<GovernmentIDSectionProps> = ({
  register,
  errors,
  setValue,
}) => {
  const handleGSISChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatGSIS(e.target.value);
    setValue("gsisNumber", formatted, { shouldValidate: true });
  };
  const handlePagIBIGChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPagIBIG(e.target.value);
    setValue("pagibigNumber", formatted, { shouldValidate: true });
  };
  const handlePhilHealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhilHealth(e.target.value);
    setValue("philhealthNumber", formatted, { shouldValidate: true });
  };
  const handleUMIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUMID(e.target.value);
    setValue("umidNumber", formatted, { shouldValidate: true });
  };
  const handlePhilSysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhilSys(e.target.value);
    setValue("philsysId", formatted, { shouldValidate: true });
  };
  const handleTINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTIN(e.target.value);
    setValue("tinNumber", formatted, { shouldValidate: true });
  };
  return (
    <div className="space-y-6">
      {" "}
      <div>
        {" "}
        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-widest flex items-center gap-3">
          {" "}
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>{" "}
          Government Identification Numbers{" "}
        </h3>{" "}
        <p className="text-xs text-slate-500 font-semibold mb-6">
          Provide your government-issued ID numbers
        </p>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {" "}
        {/* GSIS Number */}{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            GSIS Number{" "}
          </label>{" "}
          <input
            {...register("gsisNumber")}
            onChange={handleGSISChange}
            className={`w-full border ${errors.gsisNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="12345678901"
            maxLength={11}
          />{" "}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 12345678901 (11 digits)
          </p>{" "}
          {errors.gsisNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.gsisNumber.message}
            </p>
          )}{" "}
        </div>{" "}
        {/* Pag-IBIG Number */}{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Pag-IBIG Number{" "}
          </label>{" "}
          <input
            {...register("pagibigNumber")}
            onChange={handlePagIBIGChange}
            className={`w-full border ${errors.pagibigNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="123456789012"
            maxLength={12}
          />{" "}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 1234-567890-1 (12 digits)
          </p>{" "}
          {errors.pagibigNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.pagibigNumber.message}
            </p>
          )}{" "}
        </div>{" "}
        {/* PhilHealth Number */}{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            PhilHealth Number{" "}
          </label>{" "}
          <input
            {...register("philhealthNumber")}
            onChange={handlePhilHealthChange}
            className={`w-full border ${errors.philhealthNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="12-345678901-2"
            maxLength={14}
          />{" "}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 12-345678901-2
          </p>{" "}
          {errors.philhealthNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.philhealthNumber.message}
            </p>
          )}{" "}
        </div>{" "}
        {/* UMID Number */}{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            UMID Number{" "}
          </label>{" "}
          <input
            {...register("umidNumber")}
            onChange={handleUMIDChange}
            className={`w-full border ${errors.umidNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="1234-5678901-2"
            maxLength={14}
          />{" "}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 1234-5678901-2
          </p>{" "}
          {errors.umidNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.umidNumber.message}
            </p>
          )}{" "}
        </div>{" "}
        {/* PhilSys ID */}{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            PhilSys ID{" "}
          </label>{" "}
          <input
            {...register("philsysId")}
            onChange={handlePhilSysChange}
            className={`w-full border ${errors.philsysId ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="1234-5678-9012-3456"
            maxLength={19}
          />{" "}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 1234-5678-9012-3456
          </p>{" "}
          {errors.philsysId && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.philsysId.message}
            </p>
          )}{" "}
        </div>{" "}
        {/* TIN Number */}{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            TIN Number{" "}
          </label>{" "}
          <input
            {...register("tinNumber")}
            onChange={handleTINChange}
            className={`w-full border ${errors.tinNumber ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="123-456-789-000"
            maxLength={15}
          />{" "}
          <p className="text-[10px] text-gray-500 mt-1 ml-1">
            Format: 123-456-789-000
          </p>{" "}
          {errors.tinNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.tinNumber.message}
            </p>
          )}{" "}
        </div>{" "}
      </div>{" "}
      <div className="pt-6 border-t border-slate-100">
        {" "}
        <h4 className="text-sm font-black text-slate-900 mb-4 tracking-widest flex items-center gap-2">
          {" "}
          Other Government Issued ID{" "}
          <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">
            (Required if the above are not available)
          </span>{" "}
        </h4>{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {" "}
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              ID Type{" "}
            </label>{" "}
            <input
              {...register("govtIdType")}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. Driver's License, Passport"
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              ID Number{" "}
            </label>{" "}
            <input
              {...register("govtIdNo")}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="Enter ID Number"
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              Place / Date of Issuance{" "}
            </label>{" "}
            <input
              {...register("govtIdIssuance")}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. LTO Manila / 2023-01-01"
            />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        {" "}
        <p className="text-xs text-blue-700 font-semibold">
          {" "}
          Note: Government ID numbers will be auto-formatted as you type.
          Requirements may vary based on the job position.{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
};
export default GovernmentIDSection;
