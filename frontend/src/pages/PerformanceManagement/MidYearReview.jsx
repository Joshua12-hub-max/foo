import { useState, useEffect } from 'react';
import { Calendar, User, FileText, CheckCircle, AlertCircle, Star, X, Save, ChevronLeft } from 'lucide-react';
import { fetchMidYearReview, submitMidYearReview } from '../../api/spmsApi';
import { useParams, useNavigate } from 'react-router-dom';

const MidYearReview = () => {
  const { ipcrId } = useParams();
  const navigate = useNavigate();
  
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    mid_year_rating: '',
    mid_year_accomplishments: '',
    mid_year_challenges: '',
    mid_year_recommendations: '',
    mid_year_employee_remarks: '',
    mid_year_supervisor_remarks: ''
  });

  useEffect(() => {
    if (ipcrId) {
      loadReview();
    }
  }, [ipcrId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMidYearReview(ipcrId);
      const reviewData = response.midYearReview;
      setReview(reviewData);
      
      // Pre-fill form with existing data
      setFormData({
        mid_year_rating: reviewData.mid_year_rating || '',
        mid_year_accomplishments: reviewData.mid_year_accomplishments || '',
        mid_year_challenges: reviewData.mid_year_challenges || '',
        mid_year_recommendations: reviewData.mid_year_recommendations || '',
        mid_year_employee_remarks: reviewData.mid_year_employee_remarks || '',
        mid_year_supervisor_remarks: reviewData.mid_year_supervisor_remarks || ''
      });
    } catch (err) {
      console.error('Error loading mid-year review:', err);
      setError('Failed to load mid-year review data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await submitMidYearReview(ipcrId, formData);
      setSuccess('Mid-year review submitted successfully');
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      console.error('Error submitting mid-year review:', err);
      setError('Failed to submit mid-year review');
    } finally {
      setSaving(false);
    }
  };

  const getAdjectivalRating = (score) => {
    if (!score) return '-';
    const num = parseFloat(score);
    if (num >= 4.500) return 'Outstanding';
    if (num >= 3.500) return 'Very Satisfactory';
    if (num >= 2.500) return 'Satisfactory';
    if (num >= 1.500) return 'Unsatisfactory';
    return 'Poor';
  };

  const getRatingColor = (rating) => {
    const colors = {
      'Outstanding': 'text-purple-600 bg-purple-100',
      'Very Satisfactory': 'text-blue-600 bg-blue-100',
      'Satisfactory': 'text-green-600 bg-green-100',
      'Unsatisfactory': 'text-yellow-600 bg-yellow-100',
      'Poor': 'text-red-600 bg-red-100'
    };
    return colors[rating] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading mid-year review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mid-Year Performance Review</h1>
          <p className="text-gray-600">
            {review?.employee_first_name} {review?.employee_last_name} • {review?.cycle_title} {review?.cycle_year}
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">&times;</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Interim Rating
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mid-Year Rating (1.00 - 5.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max="5"
                value={formData.mid_year_rating}
                onChange={(e) => setFormData({ ...formData, mid_year_rating: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjectival Rating
              </label>
              <div className={`px-4 py-2 rounded-lg font-medium ${getRatingColor(getAdjectivalRating(formData.mid_year_rating))}`}>
                {getAdjectivalRating(formData.mid_year_rating)}
              </div>
            </div>
          </div>
        </div>

        {/* Accomplishments */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Accomplishments
          </h2>
          <textarea
            value={formData.mid_year_accomplishments}
            onChange={(e) => setFormData({ ...formData, mid_year_accomplishments: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="List key accomplishments for the first half of the evaluation period..."
          />
        </div>

        {/* Challenges */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Challenges Encountered
          </h2>
          <textarea
            value={formData.mid_year_challenges}
            onChange={(e) => setFormData({ ...formData, mid_year_challenges: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Describe challenges or obstacles faced..."
          />
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Recommendations
          </h2>
          <textarea
            value={formData.mid_year_recommendations}
            onChange={(e) => setFormData({ ...formData, mid_year_recommendations: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Recommendations for improvement or continued success..."
          />
        </div>

        {/* Remarks */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Remarks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Remarks
              </label>
              <textarea
                value={formData.mid_year_employee_remarks}
                onChange={(e) => setFormData({ ...formData, mid_year_employee_remarks: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Employee's comments..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor Remarks
              </label>
              <textarea
                value={formData.mid_year_supervisor_remarks}
                onChange={(e) => setFormData({ ...formData, mid_year_supervisor_remarks: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Supervisor's comments..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MidYearReview;
