import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  fetchReviewById, updateReview, createReview, fetchReviewCycles, fetchCriteria, 
  submitSupervisorRating, submitSelfRating, acknowledgeReview, 
  updateCriteria, deleteCriteria,
  addItem as addItemApi, updateItem as updateItemApi, deleteItem as deleteItemApi
} from '@/api/performanceApi';
import { fetchEmployees } from '@/api/employeeApi';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/components/Custom/EmployeeManagement/Admin';
import { INITIAL_REVIEW_FORM } from '@/components/Custom/Performance/constants/performanceConstants';

const DEFAULT_QUALITATIVE_CONFIG = [
  { id: 'strengths', label: 'Strengths', placeholder: "List the employee's competencies and behavioral assets...", badge: 'Strengths', badgeColor: 'bg-green-50 text-green-700 border-green-100', iconName: 'Zap' },
  { id: 'improvements', label: 'Areas for Improvement', placeholder: "List the competencies and behavioral gaps...", badge: 'Improvements', badgeColor: 'bg-orange-50 text-orange-700 border-orange-100', iconName: 'Target' },
  { id: 'training', label: 'Training Recommendations', placeholder: "Recommended training and development interventions...", badge: 'Training', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100', iconName: 'BookOpen' },
  { id: 'action_plan', label: 'Action Plan', placeholder: "Detailed action plan and timelines...", badge: 'Action', badgeColor: 'bg-teal-50 text-teal-700 border-teal-100', iconName: 'ClipboardList' },
  { id: 'comments', label: 'Additional Comments', placeholder: "Any other remarks...", badge: 'Feedback', badgeColor: 'bg-gray-50 text-gray-700 border-gray-100', iconName: 'MessageSquare' }
];

export const usePerformanceReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notification, showNotification } = useNotification();
  
  const isNew = !id || id === 'new';
  const [currentReviewId, setCurrentReviewId] = useState(isNew ? null : id);
  const creationInProgress = useRef(false); // Mutex to prevent duplicate creation

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(INITIAL_REVIEW_FORM);
  const [qualitativeAssessments, setQualitativeAssessments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);

  // Load Data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [empData, cycleData, criteriaData] = await Promise.all([
          fetchEmployees(),
          fetchReviewCycles(),
          fetchCriteria()
        ]);

        if (!isMounted) return;

        if (empData.success) setEmployees(empData.employees);
        if (cycleData.success) setCycles(cycleData.cycles);

        if (currentReviewId && currentReviewId !== 'new') {
          const reviewData = await fetchReviewById(currentReviewId);
          if (!isMounted) return;
          
          if (reviewData.success) {
            const review = reviewData.review;
            
            // Parse overall_feedback
            let parsedFeedback = {};
            try {
              parsedFeedback = JSON.parse(review.overall_feedback || '{}');
              if (typeof parsedFeedback !== 'object') parsedFeedback = { additional_comments: review.overall_feedback };
            } catch (e) {
              parsedFeedback = { additional_comments: review.overall_feedback };
            }

            // Load Assessments
            let loadedAssessments = [];
            if (parsedFeedback.assessments && Array.isArray(parsedFeedback.assessments)) {
               loadedAssessments = parsedFeedback.assessments;
            } else {
               loadedAssessments = DEFAULT_QUALITATIVE_CONFIG.map(conf => ({
                   id: conf.id,
                   title: conf.label,
                   description: conf.placeholder,
                   value: parsedFeedback[conf.id] || '',
                   badge: conf.badge,
                   badgeColor: conf.badgeColor,
                   iconName: conf.iconName
               }));
            }
            
            setQualitativeAssessments(loadedAssessments);

            // Merge Items with Criteria
            let items = review.items || [];
            if (review.status === 'Draft' && criteriaData.success) {
                 const existingCriteriaIds = new Set(items.map(i => i.criteria_id).filter(id => id));
                 const missingCriteria = criteriaData.criteria.filter(c => !existingCriteriaIds.has(c.id));
                 if (missingCriteria.length > 0) {
                     const newItems = missingCriteria.map((c, index) => ({
                         id: Date.now() + index + Math.floor(Math.random() * 1000), // Temp ID
                         criteria_id: c.id,
                         score: 0,
                         comment: '',
                         self_score: 0,
                         actual_accomplishments: '',
                         criteria_title: c.title,
                         criteria_description: c.description,
                         category: c.category,
                         weight: c.weight,
                         max_score: c.max_score
                     }));
                     items = [...items, ...newItems];
                 }
            }

            setFormData({
              ...review,
              items: items,
              additional_comments: parsedFeedback.additional_comments || ''
            });
          }
        } else {
          // New Review Initialization
          if (criteriaData.success && isMounted) {
            setFormData(prev => ({
              ...prev,
              reviewer_id: user?.id,
              items: criteriaData.criteria.map(c => ({
                criteria_id: c.id,
                score: 0,
                comment: '',
                self_score: 0,
                actual_accomplishments: '',
                criteria_title: c.title,
                criteria_description: c.description,
                category: c.category,
                weight: c.weight,
                max_score: c.max_score
              }))
            }));
          }
           const initialAssessments = DEFAULT_QUALITATIVE_CONFIG.map(conf => ({
               id: conf.id,
               title: conf.label,
               description: conf.placeholder,
               value: '',
               badge: conf.badge,
               badgeColor: conf.badgeColor,
               iconName: conf.iconName
           }));
           setQualitativeAssessments(initialAssessments);
          
          const params = new URLSearchParams(window.location.search);
          const empId = params.get('employeeId');
          if (empId && isMounted) setFormData(prev => ({ ...prev, employee_id: empId }));
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load data", err);
          setError("Failed to load review data. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [currentReviewId, isNew, user]);

  // Derived Values
  const selectedEmployee = useMemo(() => employees.find(e => e.id == formData.employee_id), [employees, formData.employee_id]);
  const selectedCycle = useMemo(() => cycles.find(c => c.id == formData.review_cycle_id), [cycles, formData.review_cycle_id]);
  
  const permissions = useMemo(() => {
    const role = user?.role?.toLowerCase() || '';
    const isReviewer = ['admin', 'hr', 'supervisor'].includes(role);
    const isEmployee = role === 'employee';
    return {
      role,
      isReviewer,
      isEmployee,
      canEdit: isNew || 
        (isReviewer && !['Finalized', 'Acknowledged', 'Approved'].includes(formData.status)) ||
        (isEmployee && ['Draft', 'Self-Rated'].includes(formData.status))
    };
  }, [user, formData.status, isNew]);

  const currentScore = useMemo(() => {
    if (!formData.items || formData.items.length === 0) return '0.00';
    let totalWeightedScore = 0;
    let totalWeight = 0;
    formData.items.forEach(item => {
      const weight = parseFloat(item.weight || 1);
      const score = parseFloat(item.score || 0);
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });
    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : '0.00';
  }, [formData.items]);

  // Handlers
  const handleScoreChange = useCallback((criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, score: value } : item)
    }));
  }, []);

  const handleQETChange = useCallback((criteriaId, type, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.criteria_id !== criteriaId) return item;
        const updates = { [type]: parseFloat(value) || 0 };
        const newItem = { ...item, ...updates };
        const q = newItem.q_score || 0;
        const e = newItem.e_score || 0;
        const t = newItem.t_score || 0;
        return { ...newItem, score: parseFloat(((q + e + t) / 3).toFixed(2)) };
      })
    }));
  }, []);

  const handleCommentChange = useCallback((criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, comment: value } : item)
    }));
  }, []);

  const handleSelfScoreChange = useCallback((criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, self_score: value } : item)
    }));
  }, []);

  const handleAccomplishmentChange = useCallback((criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, actual_accomplishments: value } : item)
    }));
  }, []);


  // Edit an item - only updates this review's item, NOT master criteria
  const onEditItem = useCallback(async (updatedItem) => {
    // Helper to check if ID is a real database ID (not a temp timestamp ID)
    const isRealDbId = (id) => typeof id === 'number' && id < 10000000000;

    try {
      // Update the review item in the database only if it has a real DB ID
      if (updatedItem.id && isRealDbId(updatedItem.id)) {
        await updateItemApi(updatedItem.id, {
          score: updatedItem.score,
          comment: updatedItem.comment,
          self_score: updatedItem.self_score,
          actual_accomplishments: updatedItem.actual_accomplishments,
          q_score: updatedItem.q_score,
          e_score: updatedItem.e_score,
          t_score: updatedItem.t_score,
          criteria_title: updatedItem.criteria_title,
          criteria_description: updatedItem.criteria_description,
          category: updatedItem.category,
          weight: updatedItem.weight,
          max_score: updatedItem.max_score
        });
      }

      // Update local state
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(i => {
          if (i.id && updatedItem.id && i.id == updatedItem.id) return { ...i, ...updatedItem };
          if (i.criteria_id && updatedItem.criteria_id && i.criteria_id == updatedItem.criteria_id) return { ...i, ...updatedItem };
          return i;
        })
      }));
      showNotification("Item updated.", "success");
    } catch (error) {
      console.error("Failed to update item:", error);
      showNotification("Failed to update item.", "error");
    }
  }, [showNotification]);

  // Delete an item - only removes from this review, NOT master criteria
  const onDeleteItem = useCallback(async (itemId) => {
    const itemToDelete = formData.items.find(i => (i.id == itemId) || (i.criteria_id == itemId));
    if (!itemToDelete) {
      console.error("Item to delete not found:", itemId);
      return;
    }

    // Helper to check if ID is a real database ID (not a temp timestamp ID)
    // Temp IDs from Date.now() are typically 13+ digits (timestamps > 1 trillion)
    const isRealDbId = (id) => typeof id === 'number' && id < 10000000000;

    try {
      // Delete from performance_review_items only if it has a real database ID
      if (itemToDelete.id && isRealDbId(itemToDelete.id)) {
        await deleteItemApi(itemToDelete.id);
      }

      // Update local state
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(i => {
          if (itemToDelete.id && i.id == itemToDelete.id) return false;
          if (itemToDelete.criteria_id && i.criteria_id == itemToDelete.criteria_id) return false;
          return true;
        })
      }));
      showNotification("Item removed from review.", "success");
    } catch (error) {
      console.error("Failed to delete item:", error);
      showNotification("Failed to remove item.", "error");
    }
  }, [formData.items, showNotification]);

  // --- QA Logic ---

  const ensureReviewExists = useCallback(async () => {
    if (currentReviewId && currentReviewId !== 'new') return currentReviewId;
    if (creationInProgress.current) {
        // Wait for potential in-flight creation? Ideally just reject or wait. 
        // For now, simpler to abort to prevent race condition loop.
        console.warn("Creation already in progress");
        return null; 
    }
    
    if (!formData.employee_id) {
      showNotification("Please select an employee before making changes.", "error");
      return null;
    }
    
    try {
      creationInProgress.current = true;
      const overall_feedback = JSON.stringify({
        additional_comments: formData.additional_comments || '',
        assessments: qualitativeAssessments
      });
      
      const payload = {
        employee_id: formData.employee_id,
        reviewer_id: user?.id || formData.reviewer_id,
        review_cycle_id: formData.review_cycle_id,
        overall_feedback,
        total_score: 0,
        items: (formData.items || []).map(item => ({
          criteria_id: item.criteria_id || null,
          score: 0,
          weight: item.weight || 1,
          max_score: item.max_score || 5,
          category: item.category || 'General'
        }))
      };
      
      const res = await createReview(payload);
      if (res.success && res.reviewId) {
        setCurrentReviewId(res.reviewId);
        // Important: Update URL silently or rely on currentReviewId state
        window.history.replaceState(null, '', `/admin-dashboard/performance/reviews/${res.reviewId}`);
        return res.reviewId;
      }
      return null;
    } catch (error) {
      console.error("Auto-create failed:", error);
      showNotification("Failed to initialize draft. " + (error.response?.data?.message || ''), "error");
      return null;
    } finally {
        creationInProgress.current = false;
    }
  }, [currentReviewId, formData, qualitativeAssessments, user, showNotification]);

  // Add a new item to review - immediately persists to backend
  const handleAddItem = useCallback(async (newItemData) => {
    try {
      const reviewId = await ensureReviewExists();
      if (!reviewId) return;

      const payload = {
        review_id: reviewId,
        criteria_id: newItemData.criteria_id || null,
        criteria_title: newItemData.criteria_title || newItemData.title,
        criteria_description: newItemData.criteria_description || newItemData.description,
        weight: newItemData.weight || 1,
        max_score: newItemData.max_score || 5,
        category: newItemData.category || 'General'
      };

      const res = await addItemApi(payload);
      if (res.success && res.itemId) {
        // Add item to local state with the returned ID
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, { ...newItemData, id: res.itemId, score: 0, self_score: 0 }]
        }));
        showNotification("Criteria added successfully.", "success");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      showNotification("Failed to add criteria.", "error");
    }
  }, [ensureReviewExists, showNotification]);

  const saveAssessmentsToBackend = useCallback(async (updatedAssessments, reviewId) => {
    if (!reviewId) return;
    try {
      const overall_feedback = JSON.stringify({
        additional_comments: formData.additional_comments || '',
        assessments: updatedAssessments
      });
      await updateReview(reviewId, {
        employee_id: formData.employee_id,
        reviewer_id: user?.id || formData.reviewer_id,
        review_cycle_id: formData.review_cycle_id,
        overall_feedback
      });
    } catch (e) {
      console.error("QA Save failed", e);
    }
  }, [formData, user]);

  const handleAddAssessment = useCallback(async (newAssessment) => {
    const newItem = {
      ...newAssessment, id: Date.now().toString(), value: '',
      badge: newAssessment.badge || 'CUSTOM', badgeColor: newAssessment.badgeColor || 'bg-indigo-50 text-indigo-700', iconName: newAssessment.iconName || 'MessageSquare'
    };
    const updated = [...qualitativeAssessments, newItem];
    setQualitativeAssessments(updated);
    
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleEditAssessment = useCallback(async (updatedAssessment) => {
    const updated = qualitativeAssessments.map(i => i.id === updatedAssessment.id ? { ...i, ...updatedAssessment } : i);
    setQualitativeAssessments(updated);
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleDeleteAssessment = useCallback(async (assessmentId) => {
    const updated = qualitativeAssessments.filter(i => i.id !== assessmentId);
    setQualitativeAssessments(updated);
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleAssessmentValueChange = useCallback((id, val) => {
    setQualitativeAssessments(prev => prev.map(i => i.id === id ? { ...i, value: val } : i));
  }, []);

  const handleSave = async (action = 'save') => {
    if (!formData.employee_id) {
        showNotification("Please select an employee.", "error");
        return;
    }
    setSaving(true);
    try {
        // Unify creation logic: Always ensure ID exists first
        let reviewId = await ensureReviewExists();
        
        if (!reviewId) {
            // Should be handled by ensureReviewExists notification, but safety check
            setSaving(false);
            return;
        }

        const overall_feedback = JSON.stringify({
            additional_comments: formData.additional_comments,
            assessments: qualitativeAssessments
        });

        // Use helper to strip temp IDs
        const itemsPayload = (formData.items || []).map(item => ({
            ...item,
            id: (item.id && (typeof item.id === 'number' || !item.id.toString().startsWith('temp')) && item.id < 999999999999) ? item.id : null,
        }));

        const payload = { 
            employee_id: formData.employee_id,
            reviewer_id: user?.id || formData.reviewer_id,
            review_cycle_id: formData.review_cycle_id,
            overall_feedback,
            items: itemsPayload,
            additional_comments: formData.additional_comments
        };

        if (permissions.isEmployee) {
            if (action === 'submit') {
                await submitSelfRating(reviewId, { items: itemsPayload, employee_remarks: formData.additional_comments });
                navigate('/employee-dashboard/performance');
            } else if (action === 'acknowledge') {
                await acknowledgeReview(reviewId);
                window.location.reload();
            } else {
                await submitSelfRating(reviewId, { items: itemsPayload, employee_remarks: formData.additional_comments, isDraft: true });
                showNotification("Draft saved.", "success");
            }
            return;
        }

        if (action === 'submit') {
            const submitPayload = { items: itemsPayload, supervisor_remarks: formData.additional_comments, overall_feedback };
            await submitSupervisorRating(reviewId, submitPayload);
            navigate('/admin-dashboard/performance-reviews');
            return;
        }

        // Just Save (Existing or Newly Created via ensureReviewExists)
        await updateReview(reviewId, payload);
        showNotification("Review saved.", "success");

    } catch (err) {
        console.error(err);
        showNotification(err.response?.data?.message || "Failed to save.", "error");
    } finally {
        setSaving(false);
    }
  };

  return {
    loading, saving, error, formData, setFormData,
    qualitativeAssessments, employees, cycles,
    permissions, selectedEmployee, selectedCycle, currentScore, isNew,
    notification,
    handlers: {
        handleScoreChange, handleQETChange, handleCommentChange, handleSelfScoreChange, handleAccomplishmentChange,
        handleAddItem, onEditItem, onDeleteItem,
        handleAddAssessment, handleEditAssessment, handleDeleteAssessment, handleAssessmentValueChange,
        handleSave
    }
  };
};