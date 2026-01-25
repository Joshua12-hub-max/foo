import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  useQualificationStandards, 
  useCreateQualificationStandard,
  useUpdateQualificationStandard,
  useDeleteQualificationStandard 
} from '@/hooks/useQualificationStandards';
import { qualificationStandardSchema, type QualificationStandardFormData } from '@/schemas/compliance';
import type { QualificationStandard } from '@/api/complianceApi';

export const QualificationStandardsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQS, setEditingQS] = useState<QualificationStandard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    qs.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qs.salary_grade.toString().includes(searchTerm)
  ) || [];

  const handleOpenModal = (qs?: QualificationStandard) => {
    if (qs) {
      setEditingQS(qs);
      reset(qs);
    } else {
      setEditingQS(null);
      reset({
        position_title: '',
        salary_grade: 1,
        education_requirement: '',
        experience_years: 0,
        training_hours: 0,
        eligibility_required: '',
        competency_requirements: '',
        is_active: true,
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
    if (!confirm('Are you sure you want to delete this qualification standard?')) return;
    try {
      await deleteQS.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete QS:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Qualification Standards Library</h3>
          <p className="text-sm text-gray-500 mt-1">Manage position requirements and validate employee qualifications</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-semibold"
        >
          Add Standard
        </button>
      </div>

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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{standards?.length || 0}</div>
          <div className="text-xs text-blue-700 font-medium mt-1">Total Standards</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-900">{standards?.filter(s => s.is_active).length || 0}</div>
          <div className="text-xs text-green-700 font-medium mt-1">Active</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-900">
            {standards ? Math.round(standards.reduce((sum, s) => sum + s.salary_grade, 0) / standards.length) : 0}
          </div>
          <div className="text-xs text-purple-700 font-medium mt-1">Avg Salary Grade</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-900">
            {standards ? Math.round(standards.reduce((sum, s) => sum + s.experience_years, 0) / standards.length) : 0}
          </div>
          <div className="text-xs text-orange-700 font-medium mt-1">Avg Experience (yrs)</div>
        </div>
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Position Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SG</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Education</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Training</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Eligibility</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStandards.map((qs) => (
                  <tr key={qs.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{qs.position_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {qs.salary_grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{qs.education_requirement}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{qs.experience_years} yrs</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{qs.training_hours} hrs</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{qs.eligibility_required}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        qs.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {qs.is_active ? 'Active' : 'Inactive'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                    {...register('position_title')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="e.g., Administrative Officer V"
                  />
                  {errors.position_title && (
                    <p className="text-xs text-red-500 mt-1">{errors.position_title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Salary Grade *</label>
                  <input
                    type="number"
                    {...register('salary_grade', { valueAsNumber: true })}
                    min="1"
                    max="33"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                  {errors.salary_grade && (
                    <p className="text-xs text-red-500 mt-1">{errors.salary_grade.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Experience (years) *</label>
                  <input
                    type="number"
                    {...register('experience_years', { valueAsNumber: true })}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Education Requirement *</label>
                  <textarea
                    {...register('education_requirement')}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="e.g., Bachelor's Degree relevant to the job"
                  />
                  {errors.education_requirement && (
                    <p className="text-xs text-red-500 mt-1">{errors.education_requirement.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Training (hours) *</label>
                  <input
                    type="number"
                    {...register('training_hours', { valueAsNumber: true })}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Eligibility Required *</label>
                  <input
                    {...register('eligibility_required')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    placeholder="e.g., CS Professional, RA 1080 (CPA)"
                  />
                  {errors.eligibility_required && (
                    <p className="text-xs text-red-500 mt-1">{errors.eligibility_required.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Competency Requirements</label>
                  <textarea
                    {...register('competency_requirements')}
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
    </div>
  );
};

export default QualificationStandardsPage;
