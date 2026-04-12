import React from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";
interface PersonalInfoSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  setValue?: UseFormSetValue<JobApplicationSchema>;
}
const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="space-y-6">
      {" "}
      <div>
        {" "}
        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-widest flex items-center gap-3">
          {" "}
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>{" "}
          Personal Information{" "}
        </h3>{" "}
        <p className="text-xs text-slate-500 font-semibold mb-6">
          Please provide your complete personal details
        </p>{" "}
      </div>{" "}
      {/* Name Fields */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            First Name <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <input
            {...register("firstName")}
            className={`w-full border ${errors.firstName ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="e.g. Juan"
          />{" "}
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.firstName.message}
            </p>
          )}{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Last Name <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <input
            {...register("lastName")}
            className={`w-full border ${errors.lastName ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="e.g. Dela Cruz"
          />{" "}
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.lastName.message}
            </p>
          )}{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Middle Name{" "}
          </label>{" "}
          <input
            {...register("middleName")}
            className={`w-full border ${errors.middleName ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="e.g. Santos"
          />{" "}
          {errors.middleName && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.middleName.message}
            </p>
          )}{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Suffix{" "}
          </label>{" "}
          <select
            {...register("suffix")}
            className={`w-full border ${errors.suffix ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900`}
          >
            {" "}
            <option value="">None</option> <option value="Jr.">Jr.</option>{" "}
            <option value="Sr.">Sr.</option> <option value="II">II</option>{" "}
            <option value="III">III</option> <option value="IV">IV</option>{" "}
            <option value="V">V</option>{" "}
          </select>{" "}
          {errors.suffix && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.suffix.message}
            </p>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Birth Information */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Date of Birth <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <input
            type="date"
            {...register("birthDate")}
            className={`w-full border ${errors.birthDate ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900`}
          />{" "}
          {errors.birthDate && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.birthDate.message}
            </p>
          )}{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Place of Birth <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <input
            {...register("birthPlace")}
            className={`w-full border ${errors.birthPlace ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
            placeholder="e.g. Manila, Philippines"
          />{" "}
          {errors.birthPlace && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.birthPlace.message}
            </p>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Sex and Civil Status */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-2 ml-1">
            {" "}
            Sex <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <div className="flex gap-4">
            {" "}
            <label className="flex items-center gap-2 cursor-pointer">
              {" "}
              <input
                type="radio"
                value="Male"
                {...register("sex")}
                className="w-4 h-4 text-slate-600 focus:ring-slate-500"
              />{" "}
              <span className="text-sm font-semibold text-slate-700">
                Male
              </span>{" "}
            </label>{" "}
            <label className="flex items-center gap-2 cursor-pointer">
              {" "}
              <input
                type="radio"
                value="Female"
                {...register("sex")}
                className="w-4 h-4 text-slate-600 focus:ring-slate-500"
              />{" "}
              <span className="text-sm font-semibold text-slate-700">
                Female
              </span>{" "}
            </label>{" "}
          </div>{" "}
          {errors.sex && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.sex.message}
            </p>
          )}{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Civil Status <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <select
            {...register("civilStatus")}
            className={`w-full border ${errors.civilStatus ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900`}
          >
            {" "}
            <option value="">Select Status</option>{" "}
            <option value="Single">Single</option>{" "}
            <option value="Married">Married</option>{" "}
            <option value="Widowed">Widowed</option>{" "}
            <option value="Separated">Separated</option>{" "}
            <option value="Annulled">Annulled</option>{" "}
          </select>{" "}
          {errors.civilStatus && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.civilStatus.message}
            </p>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Optional Physical Details */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Height (cm){" "}
          </label>{" "}
          <input
            type="text"
            {...register("height")}
            className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
            placeholder="e.g. 170"
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Weight (kg){" "}
          </label>{" "}
          <input
            type="text"
            {...register("weight")}
            className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
            placeholder="e.g. 65"
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
            {" "}
            Blood Type{" "}
          </label>{" "}
          <select
            {...register("bloodType")}
            className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900"
          >
            {" "}
            <option value="">Unknown</option> <option value="A+">A+</option>{" "}
            <option value="A-">A-</option> <option value="B+">B+</option>{" "}
            <option value="B-">B-</option> <option value="AB+">AB+</option>{" "}
            <option value="AB-">AB-</option> <option value="O+">O+</option>{" "}
            <option value="O-">O-</option>{" "}
          </select>{" "}
        </div>{" "}
      </div>{" "}
      {/* Nationality (hidden, default Filipino) */}{" "}
      <input type="hidden" {...register("nationality")} value="Filipino" />{" "}
    </div>
  );
};
export default PersonalInfoSection;
