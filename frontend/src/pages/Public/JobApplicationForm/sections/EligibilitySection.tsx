import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  Control,
  useFieldArray,
} from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";
interface EligibilitySectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  control: Control<JobApplicationSchema>;
}
const EligibilitySection: React.FC<EligibilitySectionProps> = ({
  register,
  errors,
  control,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "eligibilities",
  });
  const addEligibility = () => {
    append({
      name: "",
      rating: "",
      examDate: "",
      examPlace: "",
      licenseNo: "",
      licenseValidUntil: "",
    });
  };
  return (
    <div className="space-y-6">
      {" "}
      <div>
        {" "}
        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-widest flex items-center gap-3">
          {" "}
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> Civil
          Service Eligibility{" "}
        </h3>{" "}
        <p className="text-xs text-slate-500 font-semibold mb-6">
          {" "}
          List your civil service eligibility and professional licenses (at
          least one required for Standard duty jobs){" "}
        </p>{" "}
      </div>{" "}
      {fields.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          {" "}
          <p className="text-xs text-yellow-700 font-semibold">
            {" "}
            No eligibility records added yet. Click "Add Eligibility" to get
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
              Eligibility #{index + 1}{" "}
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
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              Eligibility Name <span className="text-red-500">*</span>{" "}
            </label>{" "}
            <input
              {...register(`eligibilities.${index}.name`)}
              className={`w-full border ${errors.eligibilities?.[index]?.name ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
              placeholder="e.g. Career Service Professional, RA 1080 (Board/Bar)"
            />{" "}
            {errors.eligibilities?.[index]?.name && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {" "}
                {errors.eligibilities[index]?.name?.message}{" "}
              </p>
            )}{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Rating (if applicable){" "}
              </label>{" "}
              <input
                {...register(`eligibilities.${index}.rating`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. 85.50%"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Exam Date{" "}
              </label>{" "}
              <input
                type="date"
                {...register(`eligibilities.${index}.examDate`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900"
              />{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              Exam Place{" "}
            </label>{" "}
            <input
              {...register(`eligibilities.${index}.examPlace`)}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. Manila, Philippines"
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                License Number{" "}
              </label>{" "}
              <input
                {...register(`eligibilities.${index}.licenseNo`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. 1234567"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                License Valid Until{" "}
              </label>{" "}
              <input
                type="date"
                {...register(`eligibilities.${index}.licenseValidUntil`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900"
              />{" "}
            </div>{" "}
          </div>{" "}
        </div>
      ))}{" "}
      <button
        type="button"
        onClick={addEligibility}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:border-slate-500 hover:text-slate-600 hover:bg-slate-50 transition-all"
      >
        {" "}
        + Add Eligibility{" "}
      </button>{" "}
      {errors.eligibilities &&
        typeof errors.eligibilities.message === "string" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {" "}
            <p className="text-xs text-red-700 font-semibold">
              {" "}
              {errors.eligibilities.message}{" "}
            </p>{" "}
          </div>
        )}{" "}
    </div>
  );
};
export default EligibilitySection;
