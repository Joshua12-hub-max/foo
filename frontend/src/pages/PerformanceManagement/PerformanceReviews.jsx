import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, FileText, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { fetchReviews, fetchReviewCycles } from '@api';
import { useNavigate } from 'react-router-dom';

const PerformanceReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [cycles, setCycles] = useState([]);
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

      if (reviewsData.success) setReviews(reviewsData.reviews);
      if (cyclesData.success) setCycles(cyclesData.cycles);
    } catch (err) {
      console.error("Failed to load reviews data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Pending Approval': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.employee_first.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.employee_last.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer_first.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer_last.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCycle = filterCycle === 'All' || review.review_cycle_id === parseInt(filterCycle);
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
          className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all font-medium"
        >
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
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700"
          >
            <option value="All">All Cycles</option>
            {cycles.map(cycle => (
              <option key={cycle.id} value={cycle.id}>{cycle.title}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Completed">Completed</option>
          </select>
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
                        {review.employee_first[0]}{review.employee_last[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{review.employee_first} {review.employee_last}</p>
                        <p className="text-xs text-gray-500">{review.employee_role || 'Employee'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{review.cycle_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {review.reviewer_first} {review.reviewer_last}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-800">{review.total_score != null && review.total_score !== '' ? parseFloat(review.total_score).toFixed(2) : '-'}</span>
                    <span className="text-sm text-gray-500"> / 5</span>
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
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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
