import React from 'react';
import { useToastStore } from '@/stores';
import { ReviewList, TabNavigation } from '@/components/Custom/Performance/components';
import EmployeePerformanceLayout from '@/components/Custom/Performance/EmployeePerformanceLayout';
import useEmployeeReviews from '@/hooks/useEmployeeReviews';
import { useNavigate } from 'react-router-dom';

const EmployeeReviews = () => {
    const navigate = useNavigate();
    const showToast = useToastStore((state) => state.showToast);
    const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
    
    const {
        loading,
        error,
        activeTab,
        setActiveTab,
        pendingReviews,
        completedReviews,
        handleViewDetails,
        handleStartSelfRating
    } = useEmployeeReviews({ showNotification });

    const onViewReview = (review) => {
        // Navigate to the shared ReviewForm component
        navigate(`/employee-dashboard/performance/reviews/${review.id}`);
    };

    const tabs = [
        { id: 'pending', label: 'Pending Action', count: pendingReviews.length },
        { id: 'completed', label: 'Completed', count: completedReviews.length }
    ];

    if (error) {
        return (
            <EmployeePerformanceLayout>
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                    <p className="text-red-700 font-medium">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-700 hover:bg-red-50"
                    >
                        Try Again
                    </button>
                </div>
            </EmployeePerformanceLayout>
        );
    }

    return (
        <EmployeePerformanceLayout>

            
            <div className="space-y-6">
                <TabNavigation 
                    tabs={tabs} 
                    activeTab={activeTab} 
                    onTabChange={(id) => setActiveTab(String(id))} 
                />

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <ReviewList 
                        reviews={activeTab === 'pending' ? pendingReviews : completedReviews}
                        activeTab={activeTab}
                        onViewDetails={onViewReview}
                        onStartSelfRating={onViewReview}
                    />
                )}
            </div>
        </EmployeePerformanceLayout>
    );
};

export default EmployeeReviews;
