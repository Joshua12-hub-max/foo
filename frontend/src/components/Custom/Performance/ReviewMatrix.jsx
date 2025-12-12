import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { UI_COLORS, STATUS_GREEN, STATUS_AMBER, STATUS_RED, SLATE_BLUE } from '../../../utils/colorPalette';


const ReviewMatrix = ({ 
  items, 
  onScoreChange, 
  onCommentChange, 
  onSelfScoreChange, // For employee self-rating
  onAccomplishmentChange, // For employee actual accomplishments
  readOnly = false,
  showSelfRating = false, // Toggle to show self-rating column
  isSelfRatingMode = false // True when employee is doing self-rating
}) => {
  
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Order categories: Strategic -> Core -> Support -> General
  const categoryOrder = ['Strategic Priorities', 'Core Functions', 'Support Functions', 'General'];
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const getRatingDescription = (score) => {
    if (score === 5) return "Outstanding - Exceeded targets by 130%+, no errors, ahead of time.";
    if (score === 4) return "Very Satisfactory - Exceeded targets by 115-129%, minor errors, on time.";
    if (score === 3) return "Satisfactory - Met targets (100-114%), acceptable errors, on time.";
    if (score === 2) return "Unsatisfactory - Met 51-99% of targets, major errors, delays.";
    if (score === 1) return "Poor - Met <50% of targets, excessive errors, significant delays.";
    return "Rate the actual accomplishment against the success indicator.";
  };

  const getScoreColor = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 3) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Check if there's a significant discrepancy between self and supervisor rating
  const hasDiscrepancy = (selfScore, supervisorScore) => {
    if (!selfScore || !supervisorScore) return false;
    return Math.abs(selfScore - supervisorScore) >= 2;
  };

  return (
    <div className="space-y-8">
      {sortedCategories.map(category => (
        <div key={category} className="border rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="px-6 py-4 border-b flex justify-between items-center" style={{ backgroundColor: UI_COLORS.HEADER_BG }}>
            <h3 className="font-bold text-white text-lg uppercase tracking-wide">{category}</h3>
            <span className="text-blue-100 text-xs font-medium px-2 py-1 rounded border border-blue-400">
               Weight: {groupedItems[category].reduce((sum, item) => sum + parseFloat(item.weight || 0), 0).toFixed(0)}%
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-200 shadow-md text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">MFO / Success Indicators</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Actual Accomplishments</th>
                  {showSelfRating && (
                    <th className="px-4 py-3 text-xs font-bold text-blue-600 uppercase text-center bg-blue-50">
                      Self-Rating
                    </th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                    {showSelfRating ? 'Supervisor Rating' : 'Supervisor Rating'}
                  </th>
                  {showSelfRating && (
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-16 text-center">Diff</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedItems[category].map((item, idx) => {
                  const discrepancy = hasDiscrepancy(item.self_score, item.score);
                  
                  return (
                    <tr key={item.id || idx} className={`hover:bg-gray-50 transition-colors ${discrepancy ? 'bg-yellow-50/50' : ''}`}>
                      <td className="px-4 py-4 align-top w-1/4">
                        <div className="font-bold text-gray-800 mb-1">{item.criteria_title}</div>
                        <div className="text-sm text-gray-500 leading-relaxed">{item.criteria_description}</div>
                        <div className="mt-2 text-xs text-gray-400">Max: {item.max_score} • Weight: {item.weight}%</div>
                      </td>
                      
                      <td className="px-4 py-4 align-top w-1/4">
                        {isSelfRatingMode ? (
                          <textarea
                            value={item.actual_accomplishments || ''}
                            onChange={(e) => onAccomplishmentChange?.(item.criteria_id, e.target.value)}
                            placeholder="Describe your actual accomplishments..."
                            className="w-full p-3 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-y bg-blue-50/50"
                          />
                        ) : readOnly ? (
                          <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
                            {item.actual_accomplishments || item.comment || "No accomplishments recorded."}
                          </div>
                        ) : (
                          <textarea
                            value={item.comment || ''}
                            onChange={(e) => onCommentChange(item.criteria_id, e.target.value)}
                            placeholder="Describe actual output/accomplishments vs targets..."
                            className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-y"
                          />
                        )}
                      </td>

                      {/* Self-Rating Column */}
                      {showSelfRating && (
                        <td className="px-4 py-4 align-top text-center bg-blue-50/30">
                          {isSelfRatingMode ? (
                            <select
                              value={item.self_score || 0}
                              onChange={(e) => onSelfScoreChange?.(item.criteria_id, parseInt(e.target.value))}
                              className="w-full p-2.5 text-center font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                            >
                              <option value="0" disabled>-</option>
                              <option value="5">5 - Outstanding</option>
                              <option value="4">4 - Very Satisfactory</option>
                              <option value="3">3 - Satisfactory</option>
                              <option value="2">2 - Unsatisfactory</option>
                              <option value="1">1 - Poor</option>
                            </select>
                          ) : (
                            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-lg border ${
                              item.self_score && parseFloat(item.self_score) > 0 ? getScoreColor(parseFloat(item.self_score)) : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}>
                              {item.self_score && parseFloat(item.self_score) > 0 ? parseFloat(item.self_score) : '-'}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Supervisor Rating Column */}
                      <td className="px-4 py-4 align-top text-center">
                        {readOnly || isSelfRatingMode ? (
                          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-lg border ${
                            item.score && parseFloat(item.score) > 0 ? getScoreColor(parseFloat(item.score)) : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}>
                            {item.score && parseFloat(item.score) > 0 ? parseFloat(item.score) : '-'}
                          </div>
                        ) : (
                          <select
                            value={item.score || 0}
                            onChange={(e) => onScoreChange(item.criteria_id, parseInt(e.target.value))}
                            className="w-full p-2.5 text-center font-bold border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                          >
                            <option value="0" disabled>-</option>
                            <option value="5">5 - Outstanding</option>
                            <option value="4">4 - Very Satisfactory</option>
                            <option value="3">3 - Satisfactory</option>
                            <option value="2">2 - Unsatisfactory</option>
                            <option value="1">1 - Poor</option>
                          </select>
                        )}
                      </td>

                      {/* Discrepancy Indicator */}
                      {showSelfRating && (
                        <td className="px-4 py-4 align-top text-center">
                          {discrepancy ? (
                            <div className="flex flex-col items-center" title="Significant discrepancy between self-rating and supervisor rating">
                              <AlertTriangle className="text-yellow-500" size={20} />
                              <span className="text-xs text-yellow-600 font-medium">
                                {Math.abs(item.self_score - item.score)}
                              </span>
                            </div>
                          ) : item.self_score && item.score ? (
                            <CheckCircle2 className="text-green-500 mx-auto" size={18} />
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      {items.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <AlertCircle className="mx-auto mb-3 text-gray-300" size={48} />
          <p>No performance criteria found for this evaluation.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewMatrix;

