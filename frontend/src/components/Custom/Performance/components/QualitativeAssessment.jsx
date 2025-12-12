/**
 * QualitativeAssessment Component
 * Form for strengths, improvements, goals, and additional comments
 */

const QualitativeAssessment = ({
  formData,
  canEdit,
  onStrengthsChange,
  onImprovementsChange,
  onGoalsChange,
  onCommentsChange
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
        Qualitative Assessment
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Strengths</label>
          <textarea
            value={formData.strengths || ''}
            onChange={(e) => onStrengthsChange(e.target.value)}
            readOnly={!canEdit}
            placeholder="List the employee's competencies and behavioral assets..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 h-32 resize-none"
          />
        </div>

        {/* Areas for Improvement */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Areas for Improvement</label>
          <textarea
            value={formData.improvements || ''}
            onChange={(e) => onImprovementsChange(e.target.value)}
            readOnly={!canEdit}
            placeholder="List the competencies and behavioral gaps..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 h-32 resize-none"
          />
        </div>
      </div>

      {/* Future Goals */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Future Goals & Development Plan</label>
        <textarea
          value={formData.goals || ''}
          onChange={(e) => onGoalsChange(e.target.value)}
          readOnly={!canEdit}
          placeholder="Specific actions and goals for the next period..."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 h-24"
        />
      </div>
      
      {/* Additional Comments */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Additional Comments</label>
        <textarea
          value={formData.additional_comments || ''}
          onChange={(e) => onCommentsChange(e.target.value)}
          readOnly={!canEdit}
          placeholder="Any other remarks..."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 h-20"
        />
      </div>
    </div>
  );
};

export default QualitativeAssessment;
