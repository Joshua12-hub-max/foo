import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, ChevronRight } from 'lucide-react';
import { fetchReviews, fetchReviewCycles } from '@api';
import { useNavigate } from 'react-router-dom';
import { InternalReview, ReviewCycle } from '@/types/performance';
import Combobox from '@/components/Custom/Combobox';

const PerformanceReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<InternalReview[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCycle, setFilterCycle] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewsData, cyclesData] = await Promise.all([
        fetchReviews(),
        fetchReviewCycles()
      ]);

      if (reviewsData.success && reviewsData.reviews) setReviews(reviewsData.reviews);
      if (cyclesData.success && cyclesData.cycles) setCycles(cyclesData.cycles);
    } catch (err) {
      console.error("Failed to load reviews data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cycleOptions = useMemo(() => {
    const options = cycles.map(cycle => ({
      value: String(cycle.id),
      label: cycle.title || `Cycle ${cycle.id}`
    }));
    return [{ value: 'All', label: 'All Cycles' }, ...options];
  }, [cycles]);

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Self-Rated', label: 'Self-Rated' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Acknowledged', label: 'Acknowledged' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Finalized', label: 'Finalized' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finalized': return 'bg-green-100 text-green-700';
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Acknowledged': return 'bg-teal-100 text-teal-700';
      case 'Submitted': return 'bg-blue-100 text-blue-700';
      case 'Self-Rated': return 'bg-indigo-100 text-indigo-700';
      case 'Draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      (review.employeeFirstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.employeeLastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.reviewerFirstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.reviewerLastName || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCycle = filterCycle === 'All' || review.reviewCycleId === parseInt(filterCycle);
    const matchesStatus = filterStatus === 'All' || review.status === filterStatus;

    return matchesSearch && matchesCycle && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Performance Reviews</h1>
          <p className="text-gray-500">Track and manage employee evaluations</p>
        </div>
        <button
          onClick={() => navigate('/admin/performance/reviews/new')}
          className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
        >
          <Plus size={18} />
          <span>New Review</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by employee or reviewer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <Combobox
            options={cycleOptions}
            value={filterCycle}
            onChange={(val) => setFilterCycle(val)}
            placeholder="All Cycles"
            className="w-48"
            buttonClassName="bg-white border-gray-200"
          />
          <Combobox
            options={statusOptions}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            placeholder="All Statuses"
            className="w-48"
            buttonClassName="bg-white border-gray-200"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-200 text-gray-700 border-b border-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Employee</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Review Cycle</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Reviewer</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Score</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                        {(review.employeeFirstName || "?")[0]}{(review.employeeLastName || "?")[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{review.employeeFirstName} {review.employeeLastName}</p>
                        <p className="text-xs text-gray-500">{review.employeeJobTitle || 'Employee'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{review.reviewCycleId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {review.reviewerFirstName} {review.reviewerLastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-800">{review.totalScore != null && review.totalScore !== '' ? `${((parseFloat(review.totalScore) / 5) * 100).toFixed(0)}%` : '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/admin/performance/reviews/${review.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No reviews found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PerformanceReviews;
