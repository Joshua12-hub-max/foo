import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchReviews, 
  getReview, 
  acknowledgeReview, 
  submitSelfRating, 
  disagreeWithRating
} from '@/api/performanceApi';
import { useAuth } from '@/hooks/useAuth';

import { InternalReview, ReviewItem } from '@/types/performance';

interface UseEmployeeReviewsOptions {
  showNotification?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

/**
 * Custom hook for employee performance reviews
 */
const useEmployeeReviews = ({ showNotification }: UseEmployeeReviewsOptions = {}) => {
  const { user } = useAuth();
  
  // Notification helper - falls back to console if no callback provided
  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (showNotification) {
      showNotification(message, type);
    } else {
      if (type === 'error') {
        console.error('[Review]', message);
      } else {
        console.log('[Review]', message);
      }
    }
  };
  
  // Core state
  const [reviews, setReviews] = useState<InternalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Selected review state
  const [selectedReview, setSelectedReview] = useState<InternalReview | null>(null);
  
  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSelfRatingOpen, setIsSelfRatingOpen] = useState(false);
  const [isDisagreeOpen, setIsDisagreeOpen] = useState(false);
  
  // Form states
  const [selfRatingItems, setSelfRatingItems] = useState<ReviewItem[]>([]);
  const [selfRemarks, setSelfRemarks] = useState('');
  const [disagreeRemarks, setDisagreeRemarks] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('pending');
  const [showLegend, setShowLegend] = useState(false);

  // Load reviews on mount
  const loadReviews = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetchReviews();
      if (response.success) {
        setReviews(response.reviews);
      } else {
        setError("Failed to load reviews.");
      }
    } catch (err) {
      console.error("Error fetching employee reviews:", err);
      setError("An error occurred while loading reviews.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // View review details
  const handleViewDetails = useCallback(async (reviewId: string | number) => {
    try {
      const response = await getReview(reviewId);
      if (response.success) {
        const review = response.review;
        
        // Parse JSON feedback
        let parsedFeedback: Record<string, unknown> = {};
        try {
          parsedFeedback = JSON.parse(review.overallFeedback || '{}');
          if (typeof parsedFeedback !== 'object' || parsedFeedback === null) {
            parsedFeedback = { additionalComments: review.overallFeedback };
          }
        } catch (e) {
          parsedFeedback = { additionalComments: review.overallFeedback };
        }

        setSelectedReview({
          ...review,
          additionalComments: (parsedFeedback.additionalComments as string) || (review.additionalComments as string)
        });
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error(err);
      notify("Failed to load review details.", "error");
    }
  }, []);

  // Start self-rating process
  const handleStartSelfRating = useCallback(async (review: InternalReview) => {
    try {
      const response = await getReview(review.id);
      if (response.success) {
        setSelectedReview(response.review);
        setSelfRatingItems(response.review.items?.map((item: ReviewItem) => ({
          ...item,
          selfScore: item.selfScore || 0,
          actualAccomplishments: item.actualAccomplishments || ''
        })) || []);
        setIsSelfRatingOpen(true);
      }
    } catch (err) {
      console.error(err);
      notify("Failed to load review for self-rating.", "error");
    }
  }, []);

  // Submit self-rating
  const handleSubmitSelfRating = useCallback(async () => {
    if (!selectedReview) return;
    
    const incomplete = selfRatingItems.filter(item => !item.selfScore || item.selfScore === 0);
    if (incomplete.length > 0) {
      notify("Please provide a self-rating for all criteria.", "error");
      return;
    }

    if (!window.confirm("Submit your self-rating? You can only submit once per evaluation period.")) return;

    try {
      setSaving(true);
      const response = await submitSelfRating(selectedReview.id, {
        items: selfRatingItems.map(item => ({
          criteriaId: item.criteriaId,
          selfScore: item.selfScore,
          actualAccomplishments: item.actualAccomplishments
        })),
        employeeRemarks: selfRemarks
      });

      if (response.success) {
        const ratingResponse = response.data as { selfRatingScore?: number };
        notify(`Self-rating submitted successfully! Your average score: ${ratingResponse.selfRatingScore}`, "success");
        setIsSelfRatingOpen(false);
        setSelfRemarks('');
        loadReviews();
      }
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { message?: string } } };
      const message = apiErr.response?.data?.message || "Failed to submit self-rating.";
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }, [selectedReview, selfRatingItems, selfRemarks, loadReviews]);

  // Acknowledge review
  const handleAcknowledge = useCallback(async () => {
    if (!selectedReview) return;
    if (window.confirm("Are you sure you want to acknowledge this review? This confirms you have discussed it with your reviewer.")) {
      try {
        await acknowledgeReview(selectedReview.id);
        notify("Review acknowledged successfully.", "success");
        setIsDetailOpen(false);
        loadReviews();
      } catch (err) {
        console.error(err);
        notify("Failed to acknowledge review.", "error");
      }
    }
  }, [selectedReview, loadReviews]);

  const handleDisagree = useCallback(async () => {
    if (!selectedReview || !disagreeRemarks.trim()) {
      notify("Please provide your reason for disagreement.", "error");
      return;
    }

    try {
      setSaving(true);
      await disagreeWithRating(selectedReview.id, disagreeRemarks);
      notify("Your disagreement has been recorded. HR will review your concerns.", "success");
      setIsDisagreeOpen(false);
      setDisagreeRemarks('');
      loadReviews();
    } catch (err) {
      console.error(err);
      notify("Failed to record disagreement.", "error");
    } finally {
      setSaving(false);
    }
  }, [selectedReview, disagreeRemarks, loadReviews]);

  // Update self-rating item score
  const updateSelfRatingScore = useCallback((index: number, score: string | number) => {
    setSelfRatingItems(prev => {
      const newItems = [...prev];
      newItems[index].selfScore = parseInt(score as string);
      return newItems;
    });
  }, []);

  // Update self-rating item accomplishments
  const updateSelfRatingAccomplishments = useCallback((index: number, value: string) => {
    setSelfRatingItems(prev => {
      const newItems = [...prev];
      newItems[index].actualAccomplishments = value;
      return newItems;
    });
  }, []);

  // Filter reviews by tab - MEMOIZED
  const pendingReviews = useMemo(() => 
    reviews.filter(r => ['Draft', 'Self-Rated', 'Submitted'].includes(r.status)),
    [reviews]
  );
  
  const completedReviews = useMemo(() => 
    reviews.filter(r => ['Acknowledged', 'Approved', 'Finalized'].includes(r.status)),
    [reviews]
  );

  // Close modals helpers - MEMOIZED
  const closeDetailModal = useCallback(() => setIsDetailOpen(false), []);
  const closeSelfRatingModal = useCallback(() => setIsSelfRatingOpen(false), []);
  const closeDisagreeModal = useCallback(() => setIsDisagreeOpen(false), []);
  const openDisagreeModal = useCallback(() => setIsDisagreeOpen(true), []);

  return {
    // State
    reviews,
    loading,
    error,
    saving,
    selectedReview,
    activeTab,
    showLegend,
    selfRatingItems,
    selfRemarks,
    disagreeRemarks,
    pendingReviews,
    completedReviews,
    
    // Modal states
    isDetailOpen,
    isSelfRatingOpen,
    isDisagreeOpen,
    
    // Setters
    setActiveTab,
    setShowLegend,
    setSelfRemarks,
    setDisagreeRemarks,
    
    // Actions
    loadReviews,
    handleViewDetails,
    handleStartSelfRating,
    handleSubmitSelfRating,
    handleAcknowledge,
    handleDisagree,
    updateSelfRatingScore,
    updateSelfRatingAccomplishments,
    
    // Modal controls
    closeDetailModal,
    closeSelfRatingModal,
    closeDisagreeModal,
    openDisagreeModal
  };
};

export default useEmployeeReviews;
