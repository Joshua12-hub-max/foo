import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  Control,
  useFieldArray,
} from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";
import { register } from "module";
interface ExperienceSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  control: Control<JobApplicationSchema>;
}
const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  register,
  errors,
  control,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "workExperiences",
  });
  const addExperience = () => {
    append({
      dateFrom: "",
      dateTo: "",
      positionTitle: "",
      companyName: "",
      monthlySalary: "",
      salaryGrade: "",
      appointmentStatus: "",
      isGovernment: false,
    });
  };
  return (
    <div className="space-y-6">
      {" "}
      <div>
        {" "}
        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-widest flex items-center gap-3">
          {" "}
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> Work
          Experience{" "}
        </h3>{" "}
        <p className="text-xs text-slate-500 font-semibold mb-6">
          {" "}
          List your work experience (at least one required for Standard duty
          jobs){" "}
        </p>{" "}
      </div>{" "}
      {fields.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          {" "}
          <p className="text-xs text-yellow-700 font-semibold">
            {" "}
            No work experience added yet. Click "Add Experience" to get
            started.{" "}
          </p>{" "}
        </div>
      )}{" "}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm space-y-4"
        >
          {" "}
          <div className="flex items-center justify-between mb-2">
            {" "}
            <h4 className="text-sm font-bold text-slate-800 tracking-wider">
              {" "}
              Experience #{index + 1}{" "}
            </h4>{" "}
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-all"
              >
                {" "}
                Remove{" "}
              </button>
            )}{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Date From <span className="text-red-500">*</span>{" "}
              </label>{" "}
              <input
                type="date"
                {...register(`workExperiences.${index}.dateFrom`)}
                className={`w-full border ${errors.workExperiences?.[index]?.dateFrom ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900`}
              />{" "}
              {errors.workExperiences?.[index]?.dateFrom && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {" "}
                  {errors.workExperiences[index]?.dateFrom?.message}{" "}
                </p>
              )}{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Date To (Leave blank if current){" "}
              </label>{" "}
              <input
                type="date"
                {...register(`workExperiences.${index}.dateTo`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900"
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Position Title <span className="text-red-500">*</span>{" "}
              </label>{" "}
              <input
                {...register(`workExperiences.${index}.positionTitle`)}
                className={`w-full border ${errors.workExperiences?.[index]?.positionTitle ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                placeholder="e.g. Software Engineer"
              />{" "}
              {errors.workExperiences?.[index]?.positionTitle && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {" "}
                  {errors.workExperiences[index]?.positionTitle?.message}{" "}
                </p>
              )}{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Company Name <span className="text-red-500">*</span>{" "}
              </label>{" "}
              <input
                {...register(`workExperiences.${index}.companyName`)}
                className={`w-full border ${errors.workExperiences?.[index]?.companyName ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
                placeholder="e.g. ABC Corporation"
              />{" "}
              {errors.workExperiences?.[index]?.companyName && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {" "}
                  {errors.workExperiences[index]?.companyName?.message}{" "}
                </p>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Monthly Salary{" "}
              </label>{" "}
              <input
                {...register(`workExperiences.${index}.monthlySalary`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. 25000"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Salary Grade{" "}
              </label>{" "}
              <input
                {...register(`workExperiences.${index}.salaryGrade`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. SG-15"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Appointment Status{" "}
              </label>{" "}
              <input
                {...register(`workExperiences.${index}.appointmentStatus`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. Permanent"
              />{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="flex items-center gap-2 cursor-pointer">
              {" "}
              <input
                type="checkbox"
                {...register(`workExperiences.${index}.isGovernment`)}
                className="w-4 h-4 text-slate-600 focus:ring-slate-500 rounded"
              />{" "}
              <span className="text-xs font-semibold text-slate-700">
                Government Service
              </span>{" "}
            </label>{" "}
          </div>{" "}
        </div>
      ))}{" "}

      {/* NEW: Total Experience Summary Field */}
      <div className="pt-6 border-t border-gray-200">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-200 rounded-lg text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Total Relevant Experience</h4>
              <p className="text-[10px] text-slate-500 font-bold">SUMMARY OF YOUR PROFESSIONAL HISTORY</p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 ml-1">
              Total Years of Experience <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                {...register("totalExperienceYears", { valueAsNumber: true })}
                className={`w-full border-2 ${errors.totalExperienceYears ? "border-red-400 ring-4 ring-red-50 bg-red-50/10" : "border-slate-300 focus:ring-4 focus:ring-slate-100 focus:border-slate-500"} rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none bg-white text-slate-900 placeholder:text-gray-400 shadow-sm`}
                placeholder="e.g. 4.5"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                YEARS
              </div>
            </div>
            {errors.totalExperienceYears && (
              <p className="text-red-600 text-[10px] font-bold mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                {errors.totalExperienceYears.message as string}
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-3 ml-1 font-semibold leading-relaxed">
              Indicate the total number of years of experience relevant to the position you are applying for. 
              <span className="text-slate-700 font-bold italic ml-1 underline">This is a mandatory requirement for this job.</span>
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={addExperience}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:border-slate-500 hover:text-slate-600 hover:bg-slate-50 transition-all"
      >
        {" "}
        + Add Experience{" "}
      </button>{" "}
      {errors.workExperiences &&
        typeof errors.workExperiences.message === "string" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {" "}
            <p className="text-xs text-red-700 font-semibold">
              {" "}
              {errors.workExperiences.message}{" "}
            </p>{" "}
          </div>
        )}{" "}
    </div>
  );
};
export default ExperienceSection;
