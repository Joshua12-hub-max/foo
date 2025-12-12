import { useState, useEffect } from 'react';
import { 
  Users, Building, Calendar, FileText, AlertTriangle, CheckCircle, 
  Clock, BarChart3, Plus, RefreshCw, ChevronRight, TrendingUp
} from 'lucide-react';
import { fetchPMTDashboard, fetchPMTMembers, fetchCalibrationData } from '../../api/pmtApi';

const PMTDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [members, setMembers] = useState([]);
  const [calibration, setCalibration] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, membersRes] = await Promise.all([
        fetchPMTDashboard(),
        fetchPMTMembers()
      ]);
      if (dashRes.success) setDashboard(dashRes.dashboard);
      if (membersRes.success) setMembers(membersRes.members);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const loadCalibration = async (cycleId) => {
    try {
      const result = await fetchCalibrationData(cycleId);
      if (result.success) {
        setCalibration(result.calibrationData);
        setViolations(result.violations);
      }
    } catch (error) {
      // Handle error
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-gray-800" />
            PMT Dashboard
          </h1>
          <p className="text-sm text-gray-800 mt-1">Performance Management Team Control Center</p>
        </div>
        <button onClick={loadData} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all">
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['overview', 'members', 'calibration', 'meetings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              activeTab === tab 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="text-indigo-600" />}
              label="PMT Members"
              value={dashboard.pmtMemberCount}
              color="indigo"
            />
            <StatCard
              icon={<FileText className="text-blue-600" />}
              label="OPCRs in Review"
              value={dashboard.opcr?.pmt_review || 0}
              color="blue"
            />
            <StatCard
              icon={<AlertTriangle className="text-amber-600" />}
              label="Pending Appeals"
              value={(dashboard.appeals?.filed || 0) + (dashboard.appeals?.under_review || 0)}
              color="amber"
            />
            <StatCard
              icon={<Calendar className="text-green-600" />}
              label="Upcoming Meetings"
              value={dashboard.upcomingMeetings?.length || 0}
              color="green"
            />
          </div>

          {/* OPCR Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">OPCR Status Summary</h3>
            <div className="grid grid-cols-5 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-2xl font-bold text-gray-700">{dashboard.opcr?.draft || 0}</p>
                <p className="text-xs text-gray-500 uppercase font-semibold">Draft</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-2xl font-bold text-blue-700">{dashboard.opcr?.submitted || 0}</p>
                <p className="text-xs text-blue-600 uppercase font-semibold">Submitted</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-2xl font-bold text-amber-700">{dashboard.opcr?.pmt_review || 0}</p>
                <p className="text-xs text-amber-600 uppercase font-semibold">PMT Review</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-2xl font-bold text-green-700">{dashboard.opcr?.approved || 0}</p>
                <p className="text-xs text-green-600 uppercase font-semibold">Approved</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-2xl font-bold text-purple-700">{dashboard.opcr?.finalized || 0}</p>
                <p className="text-xs text-purple-600 uppercase font-semibold">Finalized</p>
              </div>
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Upcoming Meetings</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
            </div>
            {dashboard.upcomingMeetings?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{meeting.meeting_type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                        {meeting.meeting_time && ` at ${meeting.meeting_time}`}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6 text-sm">No upcoming meetings</p>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">PMT Members</h3>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 transition-all">
              <Plus size={16} /> Add Member
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-sm font-bold tracking-wide">Role</th>
                <th className="px-6 py-3 text-left text-sm font-bold tracking-wide">Designation</th>
                <th className="px-6 py-3 text-left text-sm font-bold tracking-wide">Office</th>
                <th className="px-6 py-3 text-left text-sm font-bold tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No PMT members configured</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'Chairperson' ? 'bg-indigo-100 text-indigo-700' :
                        member.role === 'Secretariat' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.designation || member.job_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.office || member.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Calibration Tab */}
      {activeTab === 'calibration' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Rating Calibration</h3>
              <p className="text-sm text-gray-500">Ensure department IPCR averages align with OPCR ratings</p>
            </div>
            {violations.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">{violations.length} Violation(s)</span>
              </div>
            )}
          </div>
          
          {calibration.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a performance cycle to view calibration data</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-200 shadow-md text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold tracking-wide">Department</th>
                    <th className="px-4 py-3 text-center text-sm font-bold tracking-wide">OPCR Rating</th>
                    <th className="px-4 py-3 text-center text-sm font-bold tracking-wide">Avg IPCR</th>
                    <th className="px-4 py-3 text-center text-sm font-bold tracking-wide">IPCR Count</th>
                    <th className="px-4 py-3 text-center text-sm font-bold tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {calibration.map((row, idx) => (
                    <tr key={idx} className={`${violations.some(v => v.department === row.department) ? 'bg-red-50' : 'hover:bg-[#F8F9FA] hover:shadow-xl'} transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{row.department}</td>
                      <td className="px-4 py-3 text-center">{row.opcr_rating || '—'}</td>
                      <td className="px-4 py-3 text-center">{row.avg_ipcr_rating ? row.avg_ipcr_rating.toFixed(2) : '—'}</td>
                      <td className="px-4 py-3 text-center">{row.ipcr_count}</td>
                      <td className="px-4 py-3 text-center">
                        {row.opcr_rating && row.avg_ipcr_rating ? (
                          row.avg_ipcr_rating > row.opcr_rating ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              EXCEEDS
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              VALID
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">PMT Meetings & Deliberations</h3>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium shadow-md hover:bg-gray-300 transition-all">
              <Plus size={16} /> Schedule Meeting
            </button>
          </div>
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-700">Meeting management feature</p>
            <p className="text-sm">Schedule and track PMT deliberations</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

export default PMTDashboard;
