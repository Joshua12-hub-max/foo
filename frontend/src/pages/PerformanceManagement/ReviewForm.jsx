/**
 * ReviewForm Page
 * Refactored to use modular components and constants
 */

import { useState, useEffect } from 'react';
import { Save, ArrowLeft, CheckCircle, Printer, AlertTriangle, Send, FileCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  fetchReviewById, 
  updateReview, 
  createReview, 
  fetchReviewCycles, 
  fetchCriteria, 
  submitSupervisorRating, 
  acknowledgeReview 
} from '../../api/performanceApi';
import { fetchEmployees } from '../../api/employeeApi';
import ReviewMatrix from '../../components/Custom/Performance/ReviewMatrix';
import { useAuth } from '../../hooks/useAuth';
import { 
  EmployeeInfoCard, 
  ScoreCard, 
  QualitativeAssessment, 
  SignatoriesSection 
} from '../../components/Custom/Performance/components';
import { INITIAL_REVIEW_FORM, getAdjectivalRating } from '../../components/Custom/Performance/constants/performanceConstants';

const ReviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(INITIAL_REVIEW_FORM);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  
  // Helper to get employee details
  const selectedEmployee = employees.find(e => e.id == formData.employee_id);
  const selectedCycle = cycles.find(c => c.id == formData.review_cycle_id);

  // Helper to get user role/permissions
  const userRole = user?.role?.toLowerCase() || '';
  const isEmployee = userRole === 'employee'; 
  const isReviewer = ['admin', 'hr', 'supervisor'].includes(userRole);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [empData, cycleData, criteriaData] = await Promise.all([
          fetchEmployees(),
          fetchReviewCycles(),
          fetchCriteria()
        ]);

        if (empData.success) setEmployees(empData.employees);
        if (cycleData.success) setCycles(cycleData.cycles);

        if (!isNew) {
          const reviewData = await fetchReviewById(id);
          if (reviewData.success) {
            const review = reviewData.review;
            
            // Parse overall_feedback if it's JSON
            let parsedFeedback = {};
            try {
              parsedFeedback = JSON.parse(review.overall_feedback || '{}');
              if (typeof parsedFeedback !== 'object') {
                parsedFeedback = { additional_comments: review.overall_feedback };
              }
            } catch (e) {
              parsedFeedback = { additional_comments: review.overall_feedback };
            }

            setFormData({
              ...review,
              strengths: parsedFeedback.strengths || '',
              improvements: parsedFeedback.improvements || '',
              goals: parsedFeedback.goals || '',
              additional_comments: parsedFeedback.additional_comments || ''
            });
          }
        } else {
          // Initialize items based on criteria for new review
          if (criteriaData.success) {
            setFormData(prev => ({
              ...prev,
              reviewer_id: user?.id,
              items: criteriaData.criteria.map(c => ({
                criteria_id: c.id,
                score: 0,
                comment: '',
                criteria_title: c.title,
                criteria_description: c.description,
                category: c.category,
                weight: c.weight,
                max_score: c.max_score
              }))
            }));
          }
          
          // Check for query param to pre-select employee
          const params = new URLSearchParams(window.location.search);
          const empId = params.get('employeeId');
          if (empId) {
            setFormData(prev => ({ ...prev, employee_id: empId }));
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load review data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isNew, user]);

  // Score change handler
  const handleScoreChange = (criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.criteria_id === criteriaId ? { ...item, score: value } : item
      )
    }));
  };

  // Comment change handler
  const handleCommentChange = (criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.criteria_id === criteriaId ? { ...item, comment: value } : item
      )
    }));
  };

  // Calculate total score
  const calculateTotalScore = () => {
    if (!formData.items || formData.items.length === 0) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    formData.items.forEach(item => {
      const weight = parseFloat(item.weight || 1);
      const score = parseFloat(item.score || 0);
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0.00;
  };

  // PDF Download handler
  const handleDownloadPDF = () => {
    const employeeName = formData.employee_first_name 
      ? `${formData.employee_first_name} ${formData.employee_last_name}` 
      : (selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employee');
    const reviewerName = formData.reviewer_first_name 
      ? `${formData.reviewer_first_name} ${formData.reviewer_last_name}` 
      : (user ? `${user.first_name || ''} ${user.last_name || ''}` : 'HR Admin');
    const cycleName = selectedCycle?.title || 'Performance Review';
    const currentScore = calculateTotalScore();
    const rating = getAdjectivalRating(currentScore).rating;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download PDF');
      return;
    }

    const itemsHtml = (formData.items || []).map(item => `
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 500;">${item.criteria_title || 'Criteria'}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-size: 14px;">${item.criteria_description || '-'}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; font-size: 18px;">${item.score || 0}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.comment || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Performance Evaluation - ${employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; }
            .header h1 { color: #1e3a5f; margin: 0 0 5px 0; font-size: 24px; }
            .header p { color: #6b7280; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; }
            .info-item label { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 3px; }
            .info-item span { font-size: 14px; font-weight: 600; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #1e3a5f; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            .score-box { text-align: center; background: #1e3a5f; color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
            .score-box .score { font-size: 48px; font-weight: 700; margin: 10px 0; }
            .score-box .rating { font-size: 18px; opacity: 0.9; }
            .feedback-section { margin-bottom: 20px; }
            .feedback-section h3 { font-size: 14px; color: #374151; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .feedback-section p { background: #f9fafb; padding: 12px; border-radius: 4px; min-height: 40px; margin: 0; font-size: 13px; }
            .signatories { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 60px; }
            .signatory { text-align: center; }
            .signatory .line { border-bottom: 1px solid #1f2937; height: 40px; margin-bottom: 8px; }
            .signatory .name { font-weight: 600; font-size: 14px; }
            .signatory .role { font-size: 11px; color: #6b7280; text-transform: uppercase; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CSC Performance Evaluation Form</h1>
            <p>Civil Service Commission Standards</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Employee Name</label>
              <span>${employeeName}</span>
            </div>
            <div class="info-item">
              <label>Position / Title</label>
              <span>${formData.employee_job_title || selectedEmployee?.job_title || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Department / Office</label>
              <span>${formData.employee_department || selectedEmployee?.department || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Review Period</label>
              <span>${cycleName}</span>
            </div>
          </div>

          <div class="score-box">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Final Numerical Rating</div>
            <div class="score">${currentScore}</div>
            <div class="rating">${rating}</div>
          </div>

          <h3 style="color: #1e3a5f; margin-bottom: 15px;">Performance Rating Matrix</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Criteria</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 10%;">Score</th>
                <th style="width: 35%;">Comments/Accomplishments</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <h3 style="color: #1e3a5f; margin-bottom: 15px;">Qualitative Assessment</h3>
          <div class="feedback-section">
            <h3>Strengths</h3>
            <p>${formData.strengths || 'N/A'}</p>
          </div>
          <div class="feedback-section">
            <h3>Areas for Improvement</h3>
            <p>${formData.improvements || 'N/A'}</p>
          </div>
          <div class="feedback-section">
            <h3>Future Goals & Development Plan</h3>
            <p>${formData.goals || 'N/A'}</p>
          </div>
          <div class="feedback-section">
            <h3>Additional Comments</h3>
            <p>${formData.additional_comments || 'N/A'}</p>
          </div>

          <div class="signatories">
            <div class="signatory">
              <div class="line"></div>
              <div class="name">${employeeName}</div>
              <div class="role">Ratee</div>
            </div>
            <div class="signatory">
              <div class="line"></div>
              <div class="name">${reviewerName}</div>
              <div class="role">HR Admin</div>
            </div>
            <div class="signatory">
              <div class="line"></div>
              <div class="name">Head of Office</div>
              <div class="role">Approving Authority</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Save handler
  const handleSave = async (action = 'save') => {
    if (!formData.employee_id || !formData.review_cycle_id) {
      alert("Please select an employee and a review cycle.");
      return;
    }

    try {
      setSaving(true);
      
      // Pack feedback fields into JSON
      const overall_feedback = JSON.stringify({
        strengths: formData.strengths,
        improvements: formData.improvements,
        goals: formData.goals,
        additional_comments: formData.additional_comments
      });

      // Clean items array for backend
      const cleanItems = (formData.items || []).map(item => ({
        criteria_id: item.criteria_id,
        score: parseInt(item.score) || 0,
        comment: item.comment || ''
      }));

      const payload = { 
        employee_id: formData.employee_id,
        reviewer_id: user?.id || formData.reviewer_id,
        review_cycle_id: formData.review_cycle_id,
        overall_feedback,
        total_score: parseFloat(calculateTotalScore()) || 0,
        items: cleanItems,
        strengths: formData.strengths,
        improvements: formData.improvements,
        goals: formData.goals,
        additional_comments: formData.additional_comments
      };
      
      // If submitting, use the CSC-compliant supervisor rating endpoint
      if (action === 'submit') {
        const submitPayload = {
          items: cleanItems,
          supervisor_remarks: formData.additional_comments,
          overall_feedback
        };

        if (isNew) {
          const createRes = await createReview(payload);
          if (createRes.success) {
            await submitSupervisorRating(createRes.reviewId, submitPayload);
            navigate('/admin-dashboard/performance-reviews');
            return;
          }
        } else {
          await submitSupervisorRating(id, submitPayload);
          navigate('/admin-dashboard/performance-reviews');
          return;
        }
      }

      // For Draft save, use standard updateReview
      if (isNew) {
        const res = await createReview(payload);
        navigate(`/admin-dashboard/performance/reviews/${res.reviewId}`);
      } else {
        await updateReview(id, payload);
        if (action === 'acknowledge') {
          await acknowledgeReview(id);
          window.location.reload();
        }
      }

      if(action === 'save') alert("Review saved successfully.");

    } catch (err) {
      console.error("Failed to save review", err);
      alert(err.response?.data?.message || "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

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
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48}/>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Review</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Go Back</button>
      </div>
    );
  }

  const currentScore = calculateTotalScore();
  const canEdit = isNew || (isReviewer && !['Finalized', 'Acknowledged'].includes(formData.status));

  // Get names for signatories
  const employeeName = formData.employee_first_name 
    ? `${formData.employee_first_name} ${formData.employee_last_name}` 
    : (selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employee Name');
  const reviewerName = formData.reviewer_first_name 
    ? `${formData.reviewer_first_name} ${formData.reviewer_last_name}` 
    : (user ? `${user.first_name} ${user.last_name}` : 'HR Admin');
   
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileCheck size={28} className="text-gray-800"/>
              CSC Performance Evaluation
            </h1>
            <p className="text-sm text-gray-800 font-medium">Civil Service Commission Standards</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium shadow-sm transition-colors"
          >
            <Printer size={16} />
            Download PDF
          </button>
          
          {canEdit && (
            <button
              onClick={() => handleSave('save')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          )}

          {canEdit && formData.status === 'Draft' && (
            <button
              onClick={() => handleSave('submit')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 hover:text-green-800 transition-colors shadow-md"
            >
              <Send size={18} />
              <span>Submit Review</span>
            </button>
          )}

          {isEmployee && formData.status === 'Submitted' && (
            <button
              onClick={() => handleSave('acknowledge')}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 hover:text-green-800 shadow-md transition-colors"
            >
              <CheckCircle size={18} />
              Acknowledge Review
            </button>
          )}
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      <div className="w-full space-y-6 overflow-y-auto pr-2 pb-10">
        
        {/* 1. Employee Information Card */}
        <EmployeeInfoCard
          formData={formData}
          employees={employees}
          cycles={cycles}
          isNew={isNew}
          onEmployeeChange={(value) => setFormData({...formData, employee_id: value})}
          onCycleChange={(value) => setFormData({...formData, review_cycle_id: value})}
        />

        {/* 2. Rating Matrix (SPMS) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800">Performance Rating Matrix</h2>
            <p className="text-sm text-gray-500">Rate the employee's performance based on the Major Final Outputs (MFOs) and Success Indicators.</p>
          </div>
          
          <ReviewMatrix 
            items={formData.items || []}
            onScoreChange={handleScoreChange}
            onCommentChange={handleCommentChange}
            readOnly={!canEdit}
            showSelfRating={!isNew && formData.status !== 'Draft' && parseFloat(formData.self_rating_score) > 0}
            isSelfRatingMode={false}
          />
        </div>

        {/* 3. Summary and Calculated Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Score Card */}
          <ScoreCard score={currentScore} />

          {/* 4. Qualitative Assessment */}
          <QualitativeAssessment
            formData={formData}
            canEdit={canEdit}
            onStrengthsChange={(value) => setFormData({...formData, strengths: value})}
            onImprovementsChange={(value) => setFormData({...formData, improvements: value})}
            onGoalsChange={(value) => setFormData({...formData, goals: value})}
            onCommentsChange={(value) => setFormData({...formData, additional_comments: value})}
          />
        </div>

        {/* 5. Signatories Section */}
        <SignatoriesSection
          employeeName={employeeName}
          reviewerName={reviewerName}
        />
      </div>
    </div>
  );
};

export default ReviewForm;
