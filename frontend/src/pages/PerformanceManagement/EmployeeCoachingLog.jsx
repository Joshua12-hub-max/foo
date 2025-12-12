import { useState, useEffect } from 'react';
import { Calendar, User, Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchMyCoachingSessions } from '../../api/spmsApi';
import { useOutletContext } from 'react-router-dom';

const EmployeeCoachingLog = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMyCoachingSessions();
      setSessions(response.coachingLogs || []);
    } catch (err) {
      console.error('Error loading coaching sessions:', err);
      setError('Failed to load coaching sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Rescheduled': 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const upcomingSessions = sessions.filter(s => s.status === 'Scheduled');
  const completedSessions = sessions.filter(s => s.status === 'Completed');

  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Coaching Sessions</h1>
          <p className="text-sm text-gray-800 mt-1">View your scheduled and completed coaching sessions</p>
        </div>
        <span className="text-sm text-gray-800 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          Date today: <span className="font-semibold">{today}</span>
        </span>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Upcoming Sessions</p>
            <p className="text-2xl font-bold text-blue-600">{upcomingSessions.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Completed Sessions</p>
            <p className="text-2xl font-bold text-green-600">{completedSessions.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-700 flex items-center gap-2 border border-red-100 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-800 font-medium">No coaching sessions found</p>
          <p className="text-sm text-gray-500 mt-1">Your supervisor will schedule coaching sessions when needed</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Sessions
              </h2>
              <div className="space-y-3">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSession(session)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(session.status)}`}>
                            {session.status}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">{session.coaching_type}</span>
                        </div>
                        <p className="font-bold text-gray-800 mt-2">{new Date(session.coaching_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-gray-600 mt-1">With: <span className="font-medium">{session.supervisor_first_name} {session.supervisor_last_name}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Follow-up</p>
                        <p className="text-sm font-medium text-gray-800">{session.follow_up_date ? new Date(session.follow_up_date).toLocaleDateString() : 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Sessions */}
          {completedSessions.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Completed Sessions
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-200 shadow-md text-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Supervisor</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Topics Discussed</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedSessions.map(session => (
                      <tr key={session.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors cursor-pointer" onClick={() => setSelectedSession(session)}>
                        <td className="px-6 py-4 text-sm text-gray-800">{new Date(session.coaching_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{session.coaching_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{session.supervisor_first_name} {session.supervisor_last_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{session.discussion_topics || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{session.agreed_actions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedSession(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-2 border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-gray-200 shadow-md flex justify-between items-center rounded-t-xl border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Coaching Session Details</h2>
              <button onClick={() => setSelectedSession(null)} className="text-gray-500 hover:text-red-800 transition-colors text-xl">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedSession.status)}`}>
                  {selectedSession.status}
                </span>
                <span className="text-sm text-gray-600 font-medium">{selectedSession.coaching_type}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                  <p className="font-medium text-gray-800">{new Date(selectedSession.coaching_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Supervisor</p>
                  <p className="font-medium text-gray-800">{selectedSession.supervisor_first_name} {selectedSession.supervisor_last_name}</p>
                </div>
              </div>

              {selectedSession.discussion_topics && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Discussion Topics</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedSession.discussion_topics}</p>
                </div>
              )}

              {selectedSession.agreed_actions && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Agreed Actions</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedSession.agreed_actions}</p>
                </div>
              )}

              {selectedSession.supervisor_notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Supervisor Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedSession.supervisor_notes}</p>
                </div>
              )}

              {selectedSession.follow_up_date && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Follow-up Date</p>
                  <p className="font-medium text-gray-800">{new Date(selectedSession.follow_up_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCoachingLog;
