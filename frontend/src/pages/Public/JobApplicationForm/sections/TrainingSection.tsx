import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  Control,
  useFieldArray,
} from "react-hook-form";
import type { JobApplicationSchema } from "@/schemas/recruitment";
interface TrainingSectionProps {
  register: UseFormRegister<JobApplicationSchema>;
  errors: FieldErrors<JobApplicationSchema>;
  control: Control<JobApplicationSchema>;
}
const TrainingSection: React.FC<TrainingSectionProps> = ({
  register,
  errors,
  control,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "trainings",
  });
  const addTraining = () => {
    append({
      title: "",
      dateFrom: "",
      dateTo: "",
      hoursNumber: "",
      typeOfLd: "",
      conductedBy: "",
    });
  };
  return (
    <div className="space-y-6">
      {" "}
      <div>
        {" "}
        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-widest flex items-center gap-3">
          {" "}
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>{" "}
          Training & Development Programs{" "}
        </h3>{" "}
        <p className="text-xs text-slate-500 font-semibold mb-6">
          {" "}
          List your training programs and learning & development activities
          (optional){" "}
        </p>{" "}
      </div>{" "}
      {fields.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {" "}
          <p className="text-xs text-blue-700 font-semibold">
            {" "}
            This section is optional. Click "Add Training" if you want to
            include your training programs.{" "}
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
              Training #{index + 1}{" "}
            </h4>{" "}
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-all"
            >
              {" "}
              Remove{" "}
            </button>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              Training Title <span className="text-red-500">*</span>{" "}
            </label>{" "}
            <input
              {...register(`trainings.${index}.title`)}
              className={`w-full border ${errors.trainings?.[index]?.title ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400`}
              placeholder="e.g. Project Management Seminar"
            />{" "}
            {errors.trainings?.[index]?.title && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {" "}
                {errors.trainings[index]?.title?.message}{" "}
              </p>
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
                {...register(`trainings.${index}.dateFrom`)}
                className={`w-full border ${errors.trainings?.[index]?.dateFrom ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-gray-200 focus:border-gray-400"} rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900`}
              />{" "}
              {errors.trainings?.[index]?.dateFrom && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {" "}
                  {errors.trainings[index]?.dateFrom?.message}{" "}
                </p>
              )}{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Date To{" "}
              </label>{" "}
              <input
                type="date"
                {...register(`trainings.${index}.dateTo`)}
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
                Number of Hours{" "}
              </label>{" "}
              <input
                type="number"
                {...register(`trainings.${index}.hoursNumber`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. 40"
                min="0"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
                {" "}
                Type of L&D{" "}
              </label>{" "}
              <input
                {...register(`trainings.${index}.typeOfLd`)}
                className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
                placeholder="e.g. Seminar, Workshop, Webinar"
              />{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-xs font-bold text-gray-500 tracking-wider mb-1.5 ml-1">
              {" "}
              Conducted By{" "}
            </label>{" "}
            <input
              {...register(`trainings.${index}.conductedBy`)}
              className="w-full border border-gray-200 focus:ring-gray-200 focus:border-gray-400 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all bg-gray-50 text-slate-900 placeholder:text-gray-400"
              placeholder="e.g. Training Institute, Organization Name"
            />{" "}
          </div>{" "}
        </div>
      ))}{" "}
      <button
        type="button"
        onClick={addTraining}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm font-bold text-gray-600 hover:border-slate-500 hover:text-slate-600 hover:bg-slate-50 transition-all"
      >
        {" "}
        + Add Training{" "}
      </button>{" "}
    </div>
  );
};
export default TrainingSection;
