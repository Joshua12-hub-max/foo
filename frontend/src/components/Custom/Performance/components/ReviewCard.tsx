import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, User, Edit3 } from 'lucide-react';
import { getStatusColor } from '../constants/performanceConstants';

interface ReviewType {
  id: string | number;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewerFirstName: string;
  reviewerLastName: string;
  status: string;
  selfRatingScore?: string | number;
  totalScore?: string | number;
}

interface ReviewCardProps {
  review: ReviewType;
  onViewDetails: (id: string | number) => void;
  onStartSelfRating: (review: ReviewType) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({review, onViewDetails, onStartSelfRating}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-sm shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        {/* Left Section - Review Info */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-gray-100 text-gray-700">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Performance Evaluation</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Calendar size={14} />
              <span>
                {new Date(review.reviewPeriodStart).toLocaleDateString()} - {new Date(review.reviewPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <User size={14}/>
              Reviewer: <span className="font-medium text-gray-700">{review.reviewerFirstName} {review.reviewerLastName}</span>
            </p>
          </div>
        </div>

        {/* Right Section - Status, Ratings, Actions */}
        <div className="flex flex-col items-end gap-3">
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wide border ${getStatusColor(review.status)}`}>
            {review.status}
          </span>
          
          {/* Rating Display */}
          {(review.selfRatingScore || review.totalScore) && (
            <div className="flex gap-4 text-center">
              {review.selfRatingScore && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Self</span>
                  <p className="text-lg font-bold text-gray-700">{review.selfRatingScore}</p>
                </div>
              )}
              {review.totalScore && (
                <div>
                  <span className="text-xs text-gray-800 uppercase font-bold">Reviewer</span>
                  <p className="text-lg font-bold text-gray-800">{review.totalScore ? `${((parseFloat(String(review.totalScore)) / 5) * 100).toFixed(0)}%` : '-'}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {review.status === 'Draft' && (
              <button
                onClick={() => onStartSelfRating(review)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-sm text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                <Edit3 size={14} />
                Self-Rate
              </button>
            )}
            <button
              onClick={() => onViewDetails(review.id)}
              className="px-3 py-1.5 border border-gray-200 rounded-sm text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard;
