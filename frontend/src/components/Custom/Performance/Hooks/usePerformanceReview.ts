import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  fetchReviewById, updateReview, createReview, fetchReviewCycles, fetchCriteria, 
  submitReviewerRating, submitSelfRating, acknowledgeReview, 
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

type JsonValue = string | number | boolean | null | undefined | { [key: string]: JsonValue } | JsonValue[];

const DEFAULT_QUALITATIVE_CONFIG: Assessment[] = [
  { id: 'strengths', label: 'Strengths', placeholder: "List the employee's competencies and behavioral assets...", badge: 'Strengths', badgeColor: 'bg-green-50 text-green-700 border-green-100', iconName: 'Zap' },
  { id: 'improvements', label: 'Areas for Improvement', placeholder: "List the competencies and behavioral gaps...", badge: 'Improvements', badgeColor: 'bg-orange-50 text-orange-700 border-orange-100', iconName: 'Target' },
  { id: 'training', label: 'Training Recommendations', placeholder: "Recommended training and development interventions...", badge: 'Training', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100', iconName: 'BookOpen' },
  { id: 'actionPlan', label: 'Action Plan', placeholder: "Detailed action plan and timelines...", badge: 'Action', badgeColor: 'bg-teal-50 text-teal-700 border-teal-100', iconName: 'ClipboardList' },
  { id: 'comments', label: 'Additional Comments', placeholder: "Any other remarks...", badge: 'Feedback', badgeColor: 'bg-gray-50 text-gray-700 border-gray-100', iconName: 'MessageSquare' }
];

interface FormDataState extends Omit<Partial<InternalReview>, 'items'> {
  items: Partial<ReviewItem>[];
  additionalComments?: string;
  employeeMetrics?: {
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
  employeeInfo?: {
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
  
  // Initialize with proper explicit types avoiding 'as' assertions
  const initialData: FormDataState = {
      ...INITIAL_REVIEW_FORM,
      items: [],
      additionalComments: ''
  };
  const [formData, setFormData] = useState<FormDataState>(initialData);
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

        if (empData.success && empData.employees) {
            const fetchedEmployees: Employee[] = empData.employees;
            setEmployees(fetchedEmployees);
        }
        if (cycleData.success && cycleData.cycles) {
            setCycles(cycleData.cycles);
        }

        if (currentReviewId && currentReviewId !== 'new') {
          const reviewData = await fetchReviewById(currentReviewId);
          if (!isMounted) return;
          
          if (reviewData.success && reviewData.review) {
            const review: InternalReview = reviewData.review;
            
            const isRecord = (val: unknown): val is Record<string, JsonValue> => typeof val === 'object' && val !== null && !Array.isArray(val);
            const isAssessmentArray = (val: unknown): val is Assessment[] => Array.isArray(val) && val.every(v => typeof v === 'object' && v !== null && 'id' in v);
            
            // Parse overallFeedback
            let parsedFeedback: Record<string, JsonValue> = {};
            try {
              const parsed: unknown = JSON.parse(review.overallFeedback || '{}');
              if (isRecord(parsed)) {
                  parsedFeedback = parsed;
              }
            } catch {
              parsedFeedback = { additionalComments: review.overallFeedback };
            }

            // Load Assessments
            let loadedAssessments: Assessment[] = [];
            if (isAssessmentArray(parsedFeedback.assessments)) {
               loadedAssessments = parsedFeedback.assessments;
            } else {
               loadedAssessments = DEFAULT_QUALITATIVE_CONFIG.map(conf => {
                   const valStr = String(parsedFeedback[conf.id] || '');
                   const newAss: Assessment = {
                       id: conf.id,
                       title: conf.label,
                       description: conf.placeholder,
                       value: valStr,
                       badge: conf.badge,
                       badgeColor: conf.badgeColor,
                       iconName: conf.iconName
                   };
                   return newAss;
               });
            }
            
            setQualitativeAssessments(loadedAssessments);

            // Merge Items with Criteria
            let items: Partial<ReviewItem>[] = review.items || [];
            if (review.status === 'Draft' && criteriaData.success && criteriaData.criteria) {
                 const criteria: PerformanceCriteria[] = criteriaData.criteria;
                 const existingCriteriaIds = new Set(items.map(i => i.criteriaId).filter(i => Boolean(i)));
                 const missingCriteria = criteria.filter((c: PerformanceCriteria) => !existingCriteriaIds.has(c.id));
                 if (missingCriteria.length > 0) {
                     const newItems: Partial<ReviewItem>[] = missingCriteria.map((c: PerformanceCriteria, index: number) => ({
                         id: Date.now() + index + Math.floor(Math.random() * 1000), 
                         criteriaId: c.id,
                         score: 0,
                         comment: '',
                         selfScore: 0,
                         actualAccomplishments: '',
                         criteriaTitle: c.title,
                         criteriaDescription: c.description,
                         category: c.category,
                         weight: c.weight,
                         maxScore: c.maxScore
                     }));
                     items = [...items, ...newItems];
                 }
            }

            setFormData({
              ...review,
              items: items,
              additionalComments: String(parsedFeedback.additionalComments || '')
            });

            // Fetch Metrics for existing review
            try {
              if (review.employeeId) {
                  const metricRes = await complianceApi.getEmployeeMetrics(review.employeeId.toString());
                  if (metricRes.data && metricRes.data.success) {
                    setFormData(prev => ({
                        ...prev,
                        employeeMetrics: metricRes.data.metrics,
                        employeeInfo: metricRes.data.employee
                    }));
                  }
              }
            } catch (err) {
              console.error("Failed to fetch initial metrics", err);
            }
          }
        } else {
          // New Review Initialization
          if (criteriaData.success && criteriaData.criteria && isMounted) {
            setFormData(prev => {
                const newItems: Partial<ReviewItem>[] = criteriaData.criteria!.map((c: PerformanceCriteria) => ({
                    criteriaId: c.id,
                    score: 0,
                    comment: '',
                    selfScore: 0,
                    actualAccomplishments: '',
                    criteriaTitle: c.title,
                    criteriaDescription: c.description,
                    category: c.category,
                    weight: c.weight,
                    maxScore: c.maxScore
                }));
                return {
                    ...prev,
                    reviewerId: user?.id,
                    items: newItems
                };
            });
          }
           const initialAssessments: Assessment[] = DEFAULT_QUALITATIVE_CONFIG.map(conf => ({
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
          if (empId && isMounted) setFormData(prev => ({ ...prev, employeeId: Number(empId) }));
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
    if (!formData.employeeId || !isNew) return;
    
    const fetchMetrics = async () => {
        try {
            const empIdStr = String(formData.employeeId);
            const res = await complianceApi.getEmployeeMetrics(empIdStr);
            if (res.data && res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    employeeMetrics: res.data.metrics,
                    employeeInfo: res.data.employee
                }));
            }
        } catch (error) {
            console.error("Failed to fetch metrics", error);
        }
    };
    
    fetchMetrics();
  }, [formData.employeeId, isNew]);

  const selectedEmployee = useMemo(() => employees.find(e => e.id === formData.employeeId), [employees, formData.employeeId]);
  const selectedCycle = useMemo(() => cycles.find(c => c.id == formData.reviewCycleId), [cycles, formData.reviewCycleId]);
  
  const permissions = useMemo(() => {
    const role = user?.role || '';
    const isReviewer = ['Administrator', 'Human Resource'].includes(role);
    const isEmployee = role === 'Employee';
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
    
    const baseScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
    
    // Apply Deductions (Sync with Backend Logic)
    let totalDeduction = 0;
    if (formData.employeeMetrics) {
      const { attendance, violations } = formData.employeeMetrics;
      const lateCount = attendance.totalLateCount || 0;
      const undertimeCount = attendance.totalUndertimeCount || 0;
      const absenceCount = attendance.totalAbsenceCount || 0;
      const violationCount = violations?.length || 0;
      
      // Precision Rates: 0.01 per instance, 0.05 per absence, 0.50 per violation
      totalDeduction += (lateCount + undertimeCount) * 0.01;
      totalDeduction += absenceCount * 0.05;
      totalDeduction += violationCount * 0.50;
    }

    let finalScore = baseScore - totalDeduction;
    if (finalScore < 1.00 && baseScore > 0) finalScore = 1.00;
    if (finalScore > 5.00) finalScore = 5.00;
    if (baseScore === 0) finalScore = 0;

    return finalScore.toFixed(2);
  }, [formData.items, formData.employeeMetrics]);

  const handleScoreChange = useCallback((criteriaId: string | number, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteriaId === criteriaId ? { ...item, score: Number(value) } : item)
    }));
  }, []);

  const handleQETChange = useCallback((criteriaId: string | number, type: QETField, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.criteriaId !== criteriaId) return item;
        const updates = { [type]: parseFloat(value.toString()) || 0 };
        const newItem = { ...item, ...updates };
        const q = Number(newItem.qScore) || 0;
        const e = Number(newItem.eScore) || 0;
        const t = Number(newItem.tScore) || 0;
        return { ...newItem, score: parseFloat(((q + e + t) / 3).toFixed(2)) };
      })
    }));
  }, []);


  const handleCommentChange = useCallback((criteriaId: string | number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteriaId === criteriaId ? { ...item, comment: value } : item)
    }));
  }, []);

  const handleSelfScoreChange = useCallback((criteriaId: string | number, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteriaId === criteriaId ? { ...item, selfScore: Number(value) } : item)
    }));
  }, []);

  const handleAccomplishmentChange = useCallback((criteriaId: string | number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteriaId === criteriaId ? { ...item, actualAccomplishments: value } : item)
    }));
  }, []);

  const handleEvidenceChange = useCallback((criteriaId: string | number, field: 'evidenceFilePath' | 'evidenceDescription', value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.criteriaId === criteriaId ? { ...item, [field]: value } : item)
    }));
  }, []);


  const onEditItem = useCallback(async (updatedItem: Partial<ReviewItem>) => {
    const isRealDbId = (iId: unknown) => typeof iId === 'number' && iId < 10000000000;

    try {
      if (updatedItem.id && isRealDbId(updatedItem.id)) {
        await updateItemApi(updatedItem.id, updatedItem);
      }

      setFormData(prev => ({
        ...prev,
        items: prev.items.map(i => {
          if (i.id && updatedItem.id && i.id == updatedItem.id) return { ...i, ...updatedItem };
          if (i.criteriaId && updatedItem.criteriaId && i.criteriaId == updatedItem.criteriaId) return { ...i, ...updatedItem };
          return i;
        })
      }));
      showNotification("Item updated.", "success");
    } catch (err) {
      console.error("Failed to update item:", err);
      showNotification("Failed to update item.", "error");
    }
  }, [showNotification]);

  const onDeleteItem = useCallback(async (itemId: string | number) => {
    const itemToDelete = formData.items.find(i => (i.id == itemId) || (i.criteriaId == itemId));
    if (!itemToDelete) return;

    const isRealDbId = (iId: unknown) => typeof iId === 'number' && iId < 10000000000;

    try {
      if (itemToDelete.id && isRealDbId(itemToDelete.id)) {
        await deleteItemApi(itemToDelete.id);
      }

      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(i => {
          if (itemToDelete.id && i.id == itemToDelete.id) return false;
          if (itemToDelete.criteriaId && i.criteriaId == itemToDelete.criteriaId) return false;
          return true;
        })
      }));
      showNotification("Item removed from review.", "success");
    } catch (err) {
      console.error("Failed to delete item:", err);
      showNotification("Failed to remove item.", "error");
    }
  }, [formData.items, showNotification]);

  const ensureReviewExists = useCallback(async (): Promise<string | number | null> => {
    if (currentReviewId && currentReviewId !== 'new') return currentReviewId;
    if (creationInProgress.current) return null; 
    
    if (!formData.employeeId) {
      showNotification("Please select an employee before making changes.", "error");
      return null;
    }
    
    try {
      creationInProgress.current = true;
      const overallFeedback = JSON.stringify({
        additionalComments: formData.additionalComments || '',
        assessments: qualitativeAssessments
      });
      
      const payload: Partial<InternalReview> = {
        employeeId: Number(formData.employeeId),
        reviewerId: Number(user?.id || formData.reviewerId),
        reviewCycleId: Number(formData.reviewCycleId) || undefined,
        overallFeedback,
        totalScore: "0",
      };
      
      const res = await createReview(payload);
      if (res.success && res.data?.reviewId) {
        setCurrentReviewId(res.data.reviewId);
        window.history.replaceState(null, '', `/admin-dashboard/performance/reviews/${res.data.reviewId}`);
        return res.data.reviewId;
      } else {
        showNotification(res.message || "Failed to initialize review record.", "error");
        return null;
      }
    } catch (err: unknown) {
      console.error("Auto-create failed:", err);
      const errMsg = err instanceof Error ? err.message : 'Connection error while creating review.';
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
        reviewId: Number(reviewId),
        criteriaId: newItemData.criteriaId || null,
        criteriaTitle: newItemData.criteriaTitle,
        criteriaDescription: newItemData.criteriaDescription,
        weight: Number(newItemData.weight) || 1,
        maxScore: Number(newItemData.maxScore) || 5,
        category: newItemData.category || 'General'
      };

      const res = await addItemApi(payload);
      if (res.success && res.data?.itemId) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, { ...newItemData, id: res.data!.itemId, score: 0, selfScore: 0 }]
        }));
        showNotification("Criteria added successfully.", "success");
      }
    } catch (err) {
      console.error("Failed to add item:", err);
      showNotification("Failed to add criteria.", "error");
    }
  }, [ensureReviewExists, showNotification]);

  const saveAssessmentsToBackend = useCallback(async (updatedAssessments: Assessment[], reviewId: string | number) => {
    if (!reviewId) return;
    try {
      const overallFeedback = JSON.stringify({
        additionalComments: formData.additionalComments || '',
        assessments: updatedAssessments
      });
      await updateReview(reviewId, {
        overallFeedback
      });
    } catch (err) {
      console.error("QA Save failed", err);
    }
  }, [formData.additionalComments]);

  const handleAddAssessment = useCallback(async (newAssessment: Partial<Assessment>) => {
    const newItem: Assessment = {
      id: Date.now().toString(), 
      value: newAssessment.value || '',
      title: newAssessment.title || '',
      badge: newAssessment.badge || 'CUSTOM', 
      badgeColor: newAssessment.badgeColor || 'bg-indigo-50 text-indigo-700', 
      iconName: newAssessment.iconName || 'MessageSquare',
      description: newAssessment.description || ''
    };
    const updated = [...qualitativeAssessments, newItem];
    setQualitativeAssessments(updated);
    
    const rid = await ensureReviewExists();
    if (rid) saveAssessmentsToBackend(updated, rid);
  }, [qualitativeAssessments, ensureReviewExists, saveAssessmentsToBackend]);

  const handleEditAssessment = useCallback(async (updatedAssessment: Assessment | Partial<Assessment>) => {
    if (!updatedAssessment.id) return;
    const updated = qualitativeAssessments.map(i => {
        if (i.id === updatedAssessment.id) {
            const merged: Assessment = {
                id: i.id,
                title: updatedAssessment.title ?? i.title,
                description: updatedAssessment.description ?? i.description,
                value: updatedAssessment.value ?? i.value,
                badge: updatedAssessment.badge ?? i.badge,
                badgeColor: updatedAssessment.badgeColor ?? i.badgeColor,
                iconName: updatedAssessment.iconName ?? i.iconName
            };
            return merged;
        }
        return i;
    });
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

  const handleAssessmentValueChange = useCallback((assId: string | number, val: string) => {
    setQualitativeAssessments(prev => prev.map(i => i.id === assId ? { ...i, value: val } : i));
  }, []);

  const handleSave = async (action: string = 'save') => {
    if (!formData.employeeId) {
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

        const overallFeedback = JSON.stringify({
            additionalComments: formData.additionalComments,
            assessments: qualitativeAssessments
        });

        // Filter out temporary frontend IDs (Date.now() based ones)
        const itemsPayload: Partial<ReviewItem>[] = (formData.items || []).map(item => {
            const isTempId = typeof item.id === 'string' || (typeof item.id === 'number' && item.id > 2000000000);
            const filteredItem: Partial<ReviewItem> = {
                ...item,
                id: isTempId ? undefined : item.id,
            };
            return filteredItem;
        });

        if (permissions.isEmployee) {
            if (action === 'submit') {
                const res = await submitSelfRating(reviewId, { items: itemsPayload, employeeRemarks: formData.additionalComments });
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
                const res = await submitSelfRating(reviewId, { items: itemsPayload, employeeRemarks: formData.additionalComments, isDraft: true });
                if (res.success) {
                    showNotification("Draft saved.", "success");
                } else {
                    showNotification(res.message || "Failed to save draft.", "error");
                }
            }
            return;
        }

        if (action === 'submit') {
            const res = await submitReviewerRating(reviewId, { items: itemsPayload, reviewerRemarks: formData.additionalComments, overallFeedback });
            if (res.success) {
                showNotification("Performance review submitted successfully.", "success");
                navigate('/admin-dashboard/performance-reviews');
            } else {
                showNotification(res.message || "Failed to submit reviewer rating.", "error");
            }
            return;
        }

        const res = await updateReview(reviewId, {
            items: itemsPayload as ReviewItem[],
            overallFeedback,
            reviewerRemarks: formData.additionalComments
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