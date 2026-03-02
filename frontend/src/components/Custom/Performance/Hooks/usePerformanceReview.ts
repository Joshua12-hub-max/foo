import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  fetchReviewById, updateReview, createReview, fetchReviewCycles, fetchCriteria, 
  submitSupervisorRating, submitSelfRating, acknowledgeReview, 
  updateItem as updateItemApi, deleteItem as deleteItemApi,
  addItem as addItemApi
} from '@/api/performanceApi';
import { fetchEmployees } from '@/api/employeeApi';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores';
import { complianceApi } from '@/api/complianceApi';
import { INITIAL_REVIEW_FORM } from '@/components/Custom/Performance/constants/performanceConstants';
import { 
  InternalReview, 
  ReviewItem, 
  ReviewCycle, 
  PerformanceCriteria,
  Assessment,
  QETField} from '@/types/performance';
import { Employee } from '@/types';

// Assessment interface is now imported from @/types/performance

const DEFAULT_QUALITATIVE_CONFIG: Assessment[] = [
  { id: 'strengths', label: 'Strengths', placeholder: "List the employee's competencies and behavioral assets...", badge: 'Strengths', badgeColor: 'bg-green-50 text-green-700 border-green-100', iconName: 'Zap' },
  { id: 'improvements', label: 'Areas for Improvement', placeholder: "List the competencies and behavioral gaps...", badge: 'Improvements', badgeColor: 'bg-orange-50 text-orange-700 border-orange-100', iconName: 'Target' },
  { id: 'training', label: 'Training Recommendations', placeholder: "Recommended training and development interventions...", badge: 'Training', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100', iconName: 'BookOpen' },
  { id: 'action_plan', label: 'Action Plan', placeholder: "Detailed action plan and timelines...", badge: 'Action', badgeColor: 'bg-teal-50 text-teal-700 border-teal-100', iconName: 'ClipboardList' },
  { id: 'comments', label: 'Additional Comments', placeholder: "Any other remarks...", badge: 'Feedback', badgeColor: 'bg-gray-50 text-gray-700 border-gray-100', iconName: 'MessageSquare' }
];

interface FormDataState extends Omit<Partial<InternalReview>, 'items'> {
  items: Partial<ReviewItem>[];
  additional_comments?: string;
  employee_metrics?: {
    attendance: {
      totalLateMinutes: number;
      totalUndertimeMinutes: number;
      totalLateCount: number;
      totalUndertimeCount: number;
      totalAbsenceCount: number;
      daysEquivalent: string;
    };
    violations: Array<{
      id: number;
      violationDate: string;
      penalty: string | number | null;
      status: string;
      policyTitle: string;
    }>;
  };
  employee_info?: {
    dutyType: string;
    dailyTargetHours: number;
    salaryBasis: string;
  };
}

export const usePerformanceReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = useCallback((message: string, type: 'success' | 'error') => showToast(message, type), [showToast]);
  
  const isNew = !id || id === 'new';
  const [currentReviewId, setCurrentReviewId] = useState<string | number | null>(isNew ? null : id!);
  const creationInProgress = useRef(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataState>(INITIAL_REVIEW_FORM as unknown as FormDataState);
  const [qualitativeAssessments, setQualitativeAssessments] = useState<Assessment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);

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

        if (empData.success) setEmployees(empData.employees as Employee[]);
        if (cycleData.success) setCycles(cycleData.cycles || []);

        if (currentReviewId && currentReviewId !== 'new') {
          const reviewData = await fetchReviewById(currentReviewId);
          if (!isMounted) return;
          
          if (reviewData.success) {
            const rawReview = reviewData.review;
            // Normalize potential camelCase keys from backend to snake_case expected by frontend
            const review = {
                ...rawReview,
                employee_id: rawReview.employee_id,
                reviewer_id: rawReview.reviewer_id,
                review_cycle_id: rawReview.review_cycle_id,
                items: (rawReview.items || []).map((i: ReviewItem) => ({
                    ...i,
                    criteria_id: i.criteria_id,
                    max_score: i.max_score,
                }))
            };
            
            // Parse overall_feedback
            let parsedFeedback: Record<string, unknown> = {};
            try {
              parsedFeedback = JSON.parse(review.overall_feedback || '{}');
            } catch (e) {
              parsedFeedback = { additional_comments: review.overall_feedback };
            }

            // Load Assessments
            let loadedAssessments: Assessment[] = [];
            if (parsedFeedback.assessments && Array.isArray(parsedFeedback.assessments)) {
               loadedAssessments = parsedFeedback.assessments;
            } else {
               loadedAssessments = DEFAULT_QUALITATIVE_CONFIG.map(conf => ({
                   id: conf.id,
                   title: conf.label,
                   description: conf.placeholder,
                   value: (parsedFeedback[conf.id] as string) || '',
                   badge: conf.badge,
                   badgeColor: conf.badgeColor,
                   iconName: conf.iconName
               }));
            }
            
            setQualitativeAssessments(loadedAssessments);

            // Merge Items with Criteria
            let items: Partial<ReviewItem>[] = review.items || [];
            if (review.status === 'Draft' && criteriaData.success) {
                 const criteria = criteriaData.criteria || [];
                 const existingCriteriaIds = new Set(items.map(i => i.criteria_id).filter(id => id));
                 const missingCriteria = criteria.filter((c: PerformanceCriteria) => !existingCriteriaIds.has(c.id));
                 if (missingCriteria.length > 0) {
                     const newItems = missingCriteria.map((c: PerformanceCriteria, index: number) => ({
                         id: Date.now() + index + Math.floor(Math.random() * 1000), 
                         criteria_id: c.id,
                         score: 0,
                         comment: '',
                         self_score: 0,
                         actual_accomplishments: '',
                         criteria_title: c.title,
                         criteria_description: c.description,
                         category: c.category,
                         weight: c.weight,
                         max_score: c.maxScore
                     }));
                     items = [...items, ...newItems];
                 }
            }

            setFormData({
              ...review,
              items: items,
              additional_comments: (parsedFeedback.additional_comments as string) || ''
            });

            // Fetch Metrics for existing review
            try {
              if (review.employee_id) {
                  const metricRes = await complianceApi.getEmployeeMetrics(review.employee_id.toString());
                  if (metricRes.data.success) {
                    setFormData(prev => ({
                        ...prev,
                        employee_metrics: metricRes.data.metrics,
                        employee_info: metricRes.data.employee
                    }));
                  }
              }
            } catch (e) {
              console.error("Failed to fetch initial metrics", e);
            }
          }
        } else {
          // New Review Initialization
          if (criteriaData.success && isMounted) {
            setFormData(prev => ({
              ...prev,
              reviewer_id: user?.id,
              items: (criteriaData.criteria || []).map((c: PerformanceCriteria) => ({
                criteria_id: c.id,
                score: 0,
                comment: '',
                self_score: 0,
                actual_accomplishments: '',
                criteria_title: c.title,
                criteria_description: c.description,
                category: c.category,
                weight: c.weight,
                max_score: c.maxScore
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
          if (empId && isMounted) setFormData(prev => ({ ...prev, employee_id: Number(empId) }));
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

  // Fetch Metrics when employee changes
  useEffect(() => {
    if (!formData.employee_id || !isNew) return;
    
    const fetchMetrics = async () => {
        try {
            const res = await complianceApi.getEmployeeMetrics((formData.employee_id as number).toString());
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    employee_metrics: res.data.metrics,
                    employee_info: res.data.employee
                }));
            }
        } catch (error) {
            console.error("Failed to fetch metrics", error);
        }
    };
    
    fetchMetrics();
  }, [formData.employee_id, isNew]);

  const selectedEmployee = useMemo(() => employees.find(e => e.id == formData.employee_id), [employees, formData.employee_id]);
  const selectedCycle = useMemo(() => cycles.find(c => c.id == formData.review_cycle_id), [cycles, formData.review_cycle_id]);
  
  const permissions = useMemo(() => {
    const role = user?.role?.toLowerCase() || '';
    const isReviewer = ['admin', 'Human Resource', 'supervisor'].includes(role);
    const isEmployee = role === 'employee';
    return {
      role,
      isReviewer,
      isEmployee,
      canEdit: isNew || 
        (isReviewer && !['Finalized', 'Acknowledged', 'Approved'].includes(formData.status || '')) ||
        (isEmployee && ['Draft', 'Self-Rated'].includes(formData.status || ''))
    };
  }, [user, formData.status, isNew]);

  const currentScore = useMemo(() => {
    if (!formData.items || formData.items.length === 0) return '0.00';
    let totalWeightedScore = 0;
    let totalWeight = 0;
    formData.items.forEach(item => {
      const weight = parseFloat(item.weight?.toString() || '1');
      const score = parseFloat(item.score?.toString() || '0');
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });
    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : '0.00';
  }, [formData.items]);

  const handleScoreChange = useCallback((criteriaId: string | number, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, score: Number(value) } : item)
    }));
  }, []);

  const handleQETChange = useCallback((criteriaId: string | number, type: QETField, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.criteria_id !== criteriaId) return item;
        const updates = { [type]: parseFloat(value.toString()) || 0 };
        const newItem = { ...item, ...updates };
        const q = Number(newItem.q_score) || 0;
        const e = Number(newItem.e_score) || 0;
        const t = Number(newItem.t_score) || 0;
        return { ...newItem, score: parseFloat(((q + e + t) / 3).toFixed(2)) };
      })
    }));
  }, []);

  const handleCommentChange = useCallback((criteriaId: string | number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, comment: value } : item)
    }));
  }, []);

  const handleSelfScoreChange = useCallback((criteriaId: string | number, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, self_score: Number(value) } : item)
    }));
  }, []);

  const handleAccomplishmentChange = useCallback((criteriaId: string | number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, actual_accomplishments: value } : item)
    }));
  }, []);

  const handleEvidenceChange = useCallback((criteriaId: string | number, field: 'evidence_file_path' | 'evidence_description', value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteria_id === criteriaId ? { ...item, [field]: value } : item)
    }));
  }, []);


  const onEditItem = useCallback(async (updatedItem: Partial<ReviewItem>) => {
    const isRealDbId = (id: unknown) => typeof id === 'number' && (id as number) < 10000000000;

    try {
      if (updatedItem.id && isRealDbId(updatedItem.id)) {
        await updateItemApi(updatedItem.id, updatedItem);
      }

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

  const onDeleteItem = useCallback(async (itemId: string | number) => {
    const itemToDelete = formData.items.find(i => (i.id == itemId) || (i.criteria_id == itemId));
    if (!itemToDelete) return;

    const isRealDbId = (id: unknown) => typeof id === 'number' && (id as number) < 10000000000;

    try {
      if (itemToDelete.id && isRealDbId(itemToDelete.id)) {
        await deleteItemApi(itemToDelete.id);
      }

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

  const ensureReviewExists = useCallback(async () => {
    if (currentReviewId && currentReviewId !== 'new') return currentReviewId;
    if (creationInProgress.current) return null; 
    
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
      
      const payload: Partial<InternalReview> = {
        employee_id: Number(formData.employee_id),
        reviewer_id: Number(user?.id || formData.reviewer_id),
        review_cycle_id: Number(formData.review_cycle_id),
        overall_feedback,
        total_score: "0",
      };
      
      const res = await createReview(payload);
      if (res.success && res.data.reviewId) {
        setCurrentReviewId(res.data.reviewId);
        window.history.replaceState(null, '', `/admin-dashboard/performance/reviews/${res.data.reviewId}`);
        return res.data.reviewId;
      } else {
        showNotification(res.message || "Failed to initialize review record.", "error");
        return null;
      }
    } catch (error: unknown) {
      console.error("Auto-create failed:", error);
      const errMsg = error instanceof Error ? error.message : 'Connection error while creating review.';
      showNotification(errMsg, "error");
      return null;
    } finally {
        creationInProgress.current = false;
    }
  }, [currentReviewId, formData, qualitativeAssessments, user, showNotification]);

  const handleAddItem = useCallback(async (newItemData: Partial<ReviewItem>) => {
    try {
      const reviewId = await ensureReviewExists();
      if (!reviewId) return;

      const payload: Partial<ReviewItem> = {
        review_id: Number(reviewId),
        criteria_id: newItemData.criteria_id || null,
        criteria_title: newItemData.criteria_title,
        criteria_description: newItemData.criteria_description,
        weight: Number(newItemData.weight) || 1,
        max_score: Number(newItemData.max_score) || 5,
        category: newItemData.category || 'General'
      };

      const res = await addItemApi(payload);
      if (res.success && res.data.itemId) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, { ...newItemData, id: res.data.itemId, score: 0, self_score: 0 }]
        }));
        showNotification("Criteria added successfully.", "success");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      showNotification("Failed to add criteria.", "error");
    }
  }, [ensureReviewExists, showNotification]);

  const saveAssessmentsToBackend = useCallback(async (updatedAssessments: Assessment[], reviewId: string | number) => {
    if (!reviewId) return;
    try {
      const overall_feedback = JSON.stringify({
        additional_comments: formData.additional_comments || '',
        assessments: updatedAssessments
      });
      await updateReview(reviewId, {
        overall_feedback
      });
    } catch (e) {
      console.error("QA Save failed", e);
    }
  }, [formData.additional_comments]);

  const handleAddAssessment = useCallback(async (newAssessment: Partial<Assessment>) => {
    const newItem: Assessment = {
      ...newAssessment as Assessment, 
      id: Date.now().toString(), 
      value: newAssessment.value || '',
      title: newAssessment.title || '',
      badge: newAssessment.badge || 'CUSTOM', 
      badgeColor: newAssessment.badgeColor || 'bg-indigo-50 text-indigo-700', 
      iconName: newAssessment.iconName || 'MessageSquare'
    };
    const updated = [...qualitativeAssessments, newItem];
    setQualitativeAssessments(updated);
    
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleEditAssessment = useCallback(async (updatedAssessment: Assessment | Partial<Assessment>) => {
    if (!updatedAssessment.id) return;
    const updated = qualitativeAssessments.map(i => i.id === updatedAssessment.id ? { ...i, ...updatedAssessment } as Assessment : i);
    setQualitativeAssessments(updated);
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleDeleteAssessment = useCallback(async (assessmentId: string | number) => {
    const updated = qualitativeAssessments.filter(i => i.id !== assessmentId);
    setQualitativeAssessments(updated);
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleAssessmentValueChange = useCallback((id: string | number, val: string) => {
    setQualitativeAssessments(prev => prev.map(i => i.id === id ? { ...i, value: val } : i));
  }, []);

  const handleSave = async (action: string = 'save') => {
    if (!formData.employee_id) {
        showNotification("Please select an employee.", "error");
        return;
    }
    
    setSaving(true);
    try {
        const reviewId = await ensureReviewExists();
        if (!reviewId) {
            setSaving(false);
            return;
        }

        const overall_feedback = JSON.stringify({
            additional_comments: formData.additional_comments,
            assessments: qualitativeAssessments
        });

        // Filter out temporary frontend IDs (Date.now() based ones)
        const itemsPayload = (formData.items || []).map(item => {
            const isTempId = typeof item.id === 'string' || (typeof item.id === 'number' && item.id > 2000000000);
            return {
                ...item,
                id: isTempId ? undefined : item.id,
            };
        });

        if (permissions.isEmployee) {
            if (action === 'submit') {
                const res = await submitSelfRating(reviewId, { items: itemsPayload, employee_remarks: formData.additional_comments });
                if (res.success) {
                    showNotification("Self-rating submitted successfully.", "success");
                    navigate('/employee-dashboard/performance');
                } else {
                    showNotification(res.message || "Failed to submit self-rating.", "error");
                }
            } else if (action === 'acknowledge') {
                const res = await acknowledgeReview(reviewId);
                if (res.success) {
                    showNotification("Review acknowledged.", "success");
                    window.location.reload();
                } else {
                    showNotification(res.message || "Failed to acknowledge.", "error");
                }
            } else {
                const res = await submitSelfRating(reviewId, { items: itemsPayload, employee_remarks: formData.additional_comments, isDraft: true });
                if (res.success) {
                    showNotification("Draft saved.", "success");
                } else {
                    showNotification(res.message || "Failed to save draft.", "error");
                }
            }
            return;
        }

        if (action === 'submit') {
            const res = await submitSupervisorRating(reviewId, { items: itemsPayload, supervisor_remarks: formData.additional_comments, overall_feedback });
            if (res.success) {
                showNotification("Performance review submitted successfully.", "success");
                navigate('/admin-dashboard/performance-reviews');
            } else {
                showNotification(res.message || "Failed to submit supervisor rating.", "error");
            }
            return;
        }

        const res = await updateReview(reviewId, {
            overall_feedback,
            additional_comments: formData.additional_comments
        });
        
        if (res.success) {
            showNotification("Review saved.", "success");
        } else {
            showNotification(res.message || "Failed to save review.", "error");
        }

    } catch (err: unknown) {
        console.error("Submission Error:", err);
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        showNotification(`Submission failed: ${errorMsg}`, "error");
    } finally {
        setSaving(false);
    }
  };

  return {
    loading, saving, error, formData, setFormData,
    qualitativeAssessments, employees, cycles,
    permissions, selectedEmployee, selectedCycle, currentScore, isNew,
    handlers: {
        handleScoreChange, handleQETChange, handleCommentChange, handleSelfScoreChange, handleAccomplishmentChange,
        handleAddItem, onEditItem, onDeleteItem,
        handleAddAssessment, handleEditAssessment, handleDeleteAssessment, handleAssessmentValueChange,
        handleSave, handleEvidenceChange
    }
  };
};
