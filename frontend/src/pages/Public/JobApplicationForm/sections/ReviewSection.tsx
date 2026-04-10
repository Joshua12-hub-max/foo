import React, { useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import type { JobApplicationSchema } from '@/schemas/recruitment';

interface ReviewSectionProps {
  watch: UseFormWatch<JobApplicationSchema>;
  setCurrentStep: (step: number) => void;
  onTermsChange?: (accepted: boolean) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ watch, setCurrentStep, onTermsChange }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const formData = watch();

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked);
    if (onTermsChange) {
      onTermsChange(checked);
    }
  };

  const InfoCard = ({ title, stepNumber, children }: { title: string; stepNumber: number; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
        <button
          type="button"
          onClick={() => setCurrentStep(stepNumber)}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-all"
        >
          Edit
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value || 'Not provided'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
          Review Application
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">Review all information before submitting</p>
      </div>

      {/* Personal Information */}
      <InfoCard title="Personal Information" stepNumber={0}>
        <Field label="Full Name" value={`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''} ${formData.suffix || ''}`.trim()} />
        <Field label="Birth Date" value={formData.birthDate} />
        <Field label="Birth Place" value={formData.birthPlace} />
        <Field label="Sex" value={formData.sex} />
        <Field label="Civil Status" value={formData.civilStatus} />
        <Field label="Nationality" value={formData.nationality} />
        <Field label="Blood Type" value={formData.bloodType} />
        <Field label="Height" value={formData.height ? `${formData.height} cm` : undefined} />
        <Field label="Weight" value={formData.weight ? `${formData.weight} kg` : undefined} />
      </InfoCard>

      {/* Contact Information */}
      <InfoCard title="Contact Information" stepNumber={1}>
        <Field label="Email" value={formData.email} />
        <Field label="Mobile Number" value={formData.phoneNumber} />
        <Field label="Telephone" value={formData.telephoneNumber} />
        <Field label="Emergency Contact" value={formData.emergencyContact} />
        <Field label="Emergency Contact Number" value={formData.emergencyContactNumber} />
        <Field label="Facebook" value={formData.facebookUrl} />
        <Field label="LinkedIn" value={formData.linkedinUrl} />
        <Field label="Twitter" value={formData.twitterHandle} />
      </InfoCard>

      {/* Address Information */}
      <InfoCard title="Address Information" stepNumber={2}>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Residential Address</p>
          <p className="text-sm text-gray-800 font-medium">
            {[
              formData.resHouseBlockLot,
              formData.resStreet,
              formData.resSubdivision,
              formData.resBarangay,
              formData.resCity,
              formData.zipCode
            ].filter(Boolean).join(', ') || 'Not provided'}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Permanent Address</p>
          <p className="text-sm text-gray-800 font-medium">
            {[
              formData.permHouseBlockLot,
              formData.permStreet,
              formData.permSubdivision,
              formData.permBarangay,
              formData.permCity,
              formData.permanentZipCode
            ].filter(Boolean).join(', ') || 'Same as residential'}
          </p>
        </div>
      </InfoCard>

      {/* Government IDs */}
      <InfoCard title="Government Identification" stepNumber={3}>
        <Field label="GSIS Number" value={formData.gsisNumber} />
        <Field label="Pag-IBIG Number" value={formData.pagibigNumber} />
        <Field label="PhilHealth Number" value={formData.philhealthNumber} />
        <Field label="UMID Number" value={formData.umidNumber} />
        <Field label="PhilSys ID" value={formData.philsysId} />
        <Field label="TIN Number" value={formData.tinNumber} />
      </InfoCard>

      {/* Education */}
      <InfoCard title="Educational Background" stepNumber={4}>
        {formData.education && Object.entries(formData.education).map(([level, data]) => {
          if (data?.school) {
            return (
              <div key={level} className="md:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{level}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">
                  {data.school}
                  {data.course && ` - ${data.course}`}
                  {data.yearGrad && ` (${data.yearGrad})`}
                </p>
              </div>
            );
          }
          return null;
        })}
        {!formData.education || !Object.values(formData.education).some(d => d?.school) && (
          <p className="text-sm text-gray-500 md:col-span-2">No educational background provided</p>
        )}
      </InfoCard>

      {/* Work Experience */}
      <InfoCard title="Work Experience" stepNumber={5}>
        {formData.workExperiences && formData.workExperiences.length > 0 ? (
          formData.workExperiences.map((exp, idx) => (
            <div key={idx} className="md:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Experience #{idx + 1}
              </p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">
                {exp.positionTitle} at {exp.companyName}
                {exp.dateFrom && ` (${exp.dateFrom} - ${exp.dateTo || 'Present'})`}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 md:col-span-2">No work experience provided</p>
        )}
      </InfoCard>

      {/* Eligibility */}
      <InfoCard title="Civil Service Eligibility" stepNumber={6}>
        {formData.eligibilities && formData.eligibilities.length > 0 ? (
          formData.eligibilities.map((elig, idx) => (
            <div key={idx} className="md:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Eligibility #{idx + 1}
              </p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">
                {elig.name}
                {elig.rating && ` - Rating: ${elig.rating}`}
                {elig.licenseNo && ` (License: ${elig.licenseNo})`}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 md:col-span-2">No eligibility records provided</p>
        )}
      </InfoCard>

      {/* Training */}
      {formData.trainings && formData.trainings.length > 0 && (
        <InfoCard title="Training Programs" stepNumber={7}>
          {formData.trainings.map((training, idx) => (
            <div key={idx} className="md:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Training #{idx + 1}
              </p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">
                {training.title}
                {training.hoursNumber && ` (${training.hoursNumber} hours)`}
                {training.conductedBy && ` - by ${training.conductedBy}`}
              </p>
            </div>
          ))}
        </InfoCard>
      )}

      {/* File Uploads Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">File Uploads</h4>
          <button
            type="button"
            onClick={() => setCurrentStep(8)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-all"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Resume:</span>
            <span className="text-sm text-gray-800 font-medium">
              {formData.resume instanceof File ? formData.resume.name : 'Not uploaded'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Photo:</span>
            <span className="text-sm text-gray-800 font-medium">
              {formData.photo instanceof File ? formData.photo.name : 'Not uploaded'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Certificate:</span>
            <span className="text-sm text-gray-800 font-medium">
              {formData.eligibilityCert instanceof File ? formData.eligibilityCert.name : 'Not uploaded'}
            </span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => handleTermsChange(e.target.checked)}
            className="w-5 h-5 text-slate-600 focus:ring-slate-500 rounded mt-1 flex-shrink-0"
          />
          <div className="text-sm">
            <p className="font-bold text-gray-800 mb-2">I hereby certify that:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>All information provided in this application is true and correct to the best of my knowledge</li>
              <li>I understand that any false information may result in disqualification or termination</li>
              <li>I authorize the verification of the information provided</li>
              <li>I agree to comply with all terms and conditions of the application process</li>
            </ul>
          </div>
        </label>
      </div>

      {!termsAccepted && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 font-semibold">
            Please accept the terms and conditions to submit your application.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
