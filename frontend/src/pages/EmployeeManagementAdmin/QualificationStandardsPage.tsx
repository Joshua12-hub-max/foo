import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { zodResolver } from '@/lib/zodResolver';
import { 
  useQualificationStandards, 
  useCreateQualificationStandard,
  useUpdateQualificationStandard,
  useDeleteQualificationStandard 
} from '@/hooks/useQualificationStandards';
import { qualificationStandardSchema, type QualificationStandardFormData } from '@/schemas/compliance';
import type { QualificationStandard } from '@/api/complianceApi';
import ConfirmDialog from '@/components/Custom/Shared/ConfirmDialog';

interface QualificationStandardsPageProps {
  hideHeader?: boolean;
}

export const QualificationStandardsPage: React.FC<QualificationStandardsPageProps> = ({ hideHeader = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQS, setEditingQS] = useState<QualificationStandard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [standardToDelete, setStandardToDelete] = useState<number | null>(null);

  const { data: standards, isLoading } = useQualificationStandards();
  const createQS = useCreateQualificationStandard();
  const updateQS = useUpdateQualificationStandard();
  const deleteQS = useDeleteQualificationStandard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QualificationStandardFormData>({
    resolver: zodResolver(qualificationStandardSchema),
  });

  const filteredStandards = standards?.filter(qs =>
    (qs.positionTitle && qs.positionTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (qs.salaryGrade && qs.salaryGrade.toString().includes(searchTerm))
  ) || [];

  const handleOpenModal = (qs?: QualificationStandard) => {
    if (qs) {
      setEditingQS(qs);
      reset(qs);
    } else {
      setEditingQS(null);
      reset({
        positionTitle: '',
        salaryGrade: 1,
        educationRequirement: '',
        experienceYears: 0,
        trainingHours: 0,
        eligibilityRequired: '',
        competencyRequirements: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQS(null);
    reset();
  };

  const onSubmit = async (data: QualificationStandardFormData) => {
    try {
      if (editingQS) {
        await updateQS.mutateAsync({ id: editingQS.id, data });
      } else {
        await createQS.mutateAsync(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save QS:', error);
    }
  };

  const handleDelete = async (id: number) => {
    setStandardToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!standardToDelete) return;
    try {
      await deleteQS.mutateAsync(standardToDelete);
      setIsDeleteModalOpen(false);
      setStandardToDelete(null);
    } catch (error) {
      console.error('Failed to delete QS:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Qualification Standards Library</h3>
            <p className="text-sm text-gray-500 mt-1">Manage position requirements and validate employee qualifications</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
          >
            <Plus size={18} />
            Add Standard
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by position title or salary grade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Standards', value: standards?.length || 0, color: 'bg-gray-800' },
          { label: 'Active Standards', value: standards?.filter(s => s.isActive).length || 0, color: 'bg-gray-700' },
          { label: 'Avg Salary Grade', value: standards && standards.length > 0 ? Math.round(standards.reduce((sum, s) => sum + s.salaryGrade, 0) / standards.length) : 0, color: 'bg-gray-600' },
          { label: 'Avg Experience', value: `${standards && standards.length > 0 ? Math.round(standards.reduce((sum, s) => sum + s.experienceYears, 0) / standards.length) : 0} yrs`, color: 'bg-gray-900' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-gray-300 group">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 ${stat.color} rounded-lg shadow-sm transition-transform`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStandards.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No qualification standards found</p>
            <p className="text-sm mt-1">Create your first standard to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Position Title</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">SG</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Education</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Training</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Eligibility</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStandards.map((qs) => (
                  <tr key={qs.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors group bg-white">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{qs.positionTitle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-transparent text-gray-400 border border-gray-200 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-100 transition-all">
                        {qs.salaryGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate font-medium">{qs.educationRequirement}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{qs.experienceYears} yrs</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{qs.trainingHours} hrs</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate font-medium">{qs.eligibilityRequired}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        qs.isActive 
                          ? 'bg-transparent text-gray-400 border-gray-200 group-hover:bg-green-100 group-hover:text-green-700 group-hover:border-green-100' 
                          : 'bg-transparent text-gray-400 border-gray-200 group-hover:bg-gray-100 group-hover:text-gray-700'
                      }`}>
                        {qs.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(qs)}
                          className="px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(qs.id)}
                          className="px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingQS ? 'Edit Qualification Standard' : 'Add Qualification Standard'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[80vh]">
              <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Position Title *</label>
                  <input
                    {...register('positionTitle')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="e.g., Administrative Officer V"
                  />
                  {errors.positionTitle && (
                    <p className="text-xs text-red-500 mt-1">{errors.positionTitle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Salary Grade *</label>
                  <input
                    type="number"
                    {...register('salaryGrade', { valueAsNumber: true })}
                    min="1"
                    max="33"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                  {errors.salaryGrade && (
                    <p className="text-xs text-red-500 mt-1">{errors.salaryGrade.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Experience (years) *</label>
                  <input
                    type="number"
                    {...register('experienceYears', { valueAsNumber: true })}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Education Requirement *</label>
                  <textarea
                    {...register('educationRequirement')}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="e.g., Bachelor's Degree relevant to the job"
                  />
                  {errors.educationRequirement && (
                    <p className="text-xs text-red-500 mt-1">{errors.educationRequirement.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Training (hours) *</label>
                  <input
                    type="number"
                    {...register('trainingHours', { valueAsNumber: true })}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Eligibility Required *</label>
                  <input
                    {...register('eligibilityRequired')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="e.g., CS Professional, RA 1080 (CPA)"
                  />
                  {errors.eligibilityRequired && (
                    <p className="text-xs text-red-500 mt-1">{errors.eligibilityRequired.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Competency Requirements</label>
                  <textarea
                    {...register('competencyRequirements')}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="Optional: Additional competencies required"
                  />
                </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQS.isPending || updateQS.isPending}
                  className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {editingQS ? 'Save Changes' : 'Create Standard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStandardToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Qualification Standard"
        message="Are you sure you want to delete this standard? This action cannot be undone and may affect position validation."
        confirmText="Delete Standard"
        isDestructive
      />
    </div>
  );
};

export default QualificationStandardsPage;
