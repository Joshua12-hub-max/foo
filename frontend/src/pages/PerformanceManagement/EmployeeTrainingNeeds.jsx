import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Award, Clock, CheckCircle, AlertCircle, GraduationCap } from 'lucide-react';
import { fetchMyTrainingNeeds, TRAINING_TYPES, PRIORITY_LEVELS } from '../../api/spmsApi';
import { useOutletContext } from 'react-router-dom';

const EmployeeTrainingNeeds = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMyTrainingNeeds();
      setTrainings(response.trainingNeeds || []);
    } catch (err) {
      console.error('Error loading training needs:', err);
      setError('Failed to load training records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Identified': 'bg-gray-100 text-gray-800',
      'Recommended': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Scheduled': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const level = PRIORITY_LEVELS.find(p => p.value === priority);
    return level?.color || 'text-gray-600 bg-gray-100';
  };

  const upcomingTrainings = trainings.filter(t => ['Approved', 'Scheduled'].includes(t.status));
  const completedTrainings = trainings.filter(t => t.status === 'Completed');
  const pendingTrainings = trainings.filter(t => ['Identified', 'Recommended'].includes(t.status));

  const filteredTrainings = filter === 'all' ? trainings : 
    filter === 'upcoming' ? upcomingTrainings :
    filter === 'completed' ? completedTrainings : pendingTrainings;

  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Training & Development</h1>
          <p className="text-sm text-gray-800 mt-1">View your assigned trainings and track your learning progress</p>
        </div>
        <span className="text-sm text-gray-800 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          Date today: <span className="font-semibold">{today}</span>
        </span>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Total Trainings</p>
            <p className="text-2xl font-bold text-gray-800">{trainings.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">{upcomingTrainings.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedTrainings.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingTrainings.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#F8F9FA] rounded-lg shadow-sm p-2 mb-6 flex gap-2 w-fit">
        {[
          { key: 'all', label: 'All', count: trainings.length },
          { key: 'upcoming', label: 'Upcoming', count: upcomingTrainings.length },
          { key: 'completed', label: 'Completed', count: completedTrainings.length },
          { key: 'pending', label: 'Pending', count: pendingTrainings.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:bg-white hover:text-gray-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-700 flex items-center gap-2 border border-red-100 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Trainings List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-800 font-medium">No training records found</p>
          <p className="text-sm text-gray-500 mt-1">Your supervisor will assign trainings based on your development needs</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Training</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrainings.map(training => (
                <tr key={training.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors cursor-pointer" onClick={() => setSelectedTraining(training)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{training.training_title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{training.competency_gap}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{training.training_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(training.priority)}`}>
                      {training.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {training.scheduled_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(training.scheduled_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">TBD</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(training.status)}`}>
                      {training.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Training Details Modal */}
      {selectedTraining && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedTraining(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-gray-200 shadow-md flex justify-between items-center rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Training Details</h2>
              <button onClick={() => setSelectedTraining(null)} className="text-gray-500 hover:text-red-800 transition-colors text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedTraining.status)}`}>
                  {selectedTraining.status}
                </span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityBadge(selectedTraining.priority)}`}>
                  {selectedTraining.priority} Priority
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Training Title</p>
                <p className="text-lg font-bold text-gray-800">{selectedTraining.training_title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Type</p>
                  <p className="font-medium text-gray-800">{selectedTraining.training_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Cycle</p>
                  <p className="font-medium text-gray-800">{selectedTraining.cycle_title || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Competency Gap / Learning Need</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedTraining.competency_gap}</p>
              </div>

              {selectedTraining.intervention_recommendation && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Intervention Recommendation</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedTraining.intervention_recommendation}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Scheduled Date</p>
                  <p className="font-medium text-gray-800">{selectedTraining.scheduled_date ? new Date(selectedTraining.scheduled_date).toLocaleDateString() : 'TBD'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Provider/Location</p>
                  <p className="font-medium text-gray-800">{selectedTraining.training_provider || '-'}</p>
                </div>
              </div>

              {selectedTraining.status === 'Completed' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Completion Date</p>
                      <p className="font-medium text-green-600">{selectedTraining.completion_date ? new Date(selectedTraining.completion_date).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Effectiveness Rating</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Award 
                            key={star} 
                            className={`w-5 h-5 ${star <= (selectedTraining.effectiveness_rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {selectedTraining.certificate_received && (
                    <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2 border border-green-100">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">Certificate Received</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTrainingNeeds;
