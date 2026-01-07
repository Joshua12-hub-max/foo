import { MoveLeft, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReviewMatrix from '@/components/Custom/Performance/ReviewMatrix';
import { EmployeeInfoCard, QualitativeAssessment } from '@/components/Custom/Performance/components';
import { ToastNotification } from '@/components/Custom/EmployeeManagement/Admin';
import { usePerformanceReview } from '@/components/Custom/Performance/Hooks/usePerformanceReview';

const ReviewForm = () => {
  const navigate = useNavigate();
  
  const {
    loading, saving, error, formData, setFormData,
    qualitativeAssessments, employees, cycles,
    permissions, selectedEmployee, currentScore, isNew,
    notification,
    handlers
  } = usePerformanceReview();

  const {
    handleScoreChange, handleQETChange, handleCommentChange, handleSelfScoreChange, handleAccomplishmentChange,
    handleAddItem, onEditItem, onDeleteItem,
    handleAddAssessment, handleEditAssessment, handleDeleteAssessment, handleAssessmentValueChange,
    handleSave
  } = handlers;

  const { canEdit, isEmployee } = permissions;

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-800"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm m-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Review</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Go Back</button>
      </div>
    );
  }
   
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-sm shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 max-w-[1600px] xl:max-w-[88vw]">
      
      {/* Toast Notification */}
      <ToastNotification notification={notification} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate(-1)}
                className="group flex items-center justify-center pr-2 text-gray-400 hover:text-gray-900 transition-colors duration-300"
                title="Go Back"
             >
                <MoveLeft size={32} strokeWidth={1} className="transform group-hover:-translate-x-1 transition-transform duration-300" />
             </button>
             <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {isNew ? 'New Performance Review' : 'Performance Review Details'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Manage and evaluate employee performance
                </p>
             </div>
         </div>

        <div className="flex flex-wrap items-center gap-3">
          {canEdit && formData.status === 'Draft' && (
            <button
              onClick={() => handleSave('submit')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] text-gray-700 border border-gray-200 rounded-sm shadow-sm hover:bg-gray-100 text-sm font-bold transition-all transform active:scale-95"
            >
              <Send size={16} />
              <span>{isEmployee ? 'Submit Self-Rating' : 'Submit Review'}</span>
            </button>
          )}

          {isEmployee && formData.status === 'Submitted' && (
            <button
              onClick={() => handleSave('acknowledge')}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-white text-blue-700 border border-blue-200 rounded-sm shadow-sm hover:bg-blue-50 text-sm font-bold transition-all"
            >
              <CheckCircle size={16} />
              Acknowledge Review
            </button>
          )}
        </div>
      </div>

      <hr className="mb-6 border-gray-200" />

      <div className="w-full space-y-6 pb-10"> 
        
        <EmployeeInfoCard
          formData={formData}
          employees={employees}
          cycles={cycles}
          isNew={isNew}
          onEmployeeChange={(value) => setFormData({...formData, employee_id: value})}
          onCycleChange={(value) => setFormData({...formData, review_cycle_id: value})}
        />

        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <div className="mb-6 bg-gray-50 p-4 rounded-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Performance Rating</h2>
            <p className="text-sm text-gray-600">The rating scale range from 1 to 5, with 5 being the highest (Outstanding) and 1 being the lowest (Poor).</p>
          </div>
          
          <ReviewMatrix 
            items={formData.items || []}
            onScoreChange={handleScoreChange}
            onCommentChange={handleCommentChange}
            onSelfScoreChange={handleSelfScoreChange}
            onAccomplishmentChange={handleAccomplishmentChange}
            readOnly={!canEdit}
            showSelfRating={true}
            isSelfRatingMode={isEmployee}
            finalScore={currentScore}
            onAddItem={handleAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onQETChange={handleQETChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <QualitativeAssessment
            assessments={qualitativeAssessments}
            canEdit={canEdit}
            onAdd={handleAddAssessment}
            onEdit={handleEditAssessment}
            onDelete={handleDeleteAssessment}
            onChangeValue={handleAssessmentValueChange}
            className="lg:col-span-3"
            gridClassName="grid-cols-1 md:grid-cols-3"
          />
        </div>

      </div>
    </div>
  );
};

export default ReviewForm;