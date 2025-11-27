import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Clock, FileText, User, Calendar as CalendarIcon } from 'lucide-react';
import Sidebar from "../../components/Custom/DashboardEmployeeComponents/Sidebar";
import Header from "../../components/Custom/DashboardEmployeeComponents/Header";
import WelcomeBanner from "../../components/Custom/DashboardEmployeeComponents/WelcomeBanner";
import StatCard from "../../components/Custom/DashboardEmployeeComponents/StatCard";
import ScheduleSection from "../../components/Custom/DashboardEmployeeComponents/ScheduleSection";
import EventsAndHolidays from "../../components/Custom/DashboardEmployeeComponents/EventsAndHolidays";
import AnnouncementSection from "../../components/Custom/DashboardEmployeeComponents/AnnouncementSection";
import LoadingScreen from "../../components/Custom/DashboardEmployeeComponents/LoadingScreen";
import api from "../../api/axios"; 
import { attendanceApi } from "../../api/attendanceApi";
import { leaveApi } from "../../api/leaveApi"; 

export default function EmployeeDashboard() {
  
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    reports: 0,
    leaves: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardHome = location.pathname === "/employee-dashboard" || location.pathname === "/employee-dashboard/";

  useEffect(() => 
  {const storedUser = localStorage.getItem("user");
    if (storedUser) {
          setUser(JSON.parse(storedUser));
      } else {navigate("/login");}
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
        if (!user) return;
        setLoadingStats(true);
        try {
            // Fetch logs for current month
            const now = new Date();
            const logsRes = await attendanceApi.getLogs({ 
                month: now.getMonth() + 1, 
                year: now.getFullYear(),
                id: user.id 
            });
            
            // Simple calculation (logic might need adjustment based on actual API response structure)
            const logs = logsRes.data || [];
            const present = logs.filter(l => l.status === 'Present').length;
            const late = logs.filter(l => l.status === 'Late').length;
            // Absent logic might be complex (missing logs vs status='Absent'), assuming API returns it or we rely on just present/late for now.
            const absent = logs.filter(l => l.status === 'Absent').length; 

            // Fetch leaves
            const leavesRes = await leaveApi.getMyLeaves();
            const leaves = leavesRes.data || [];
            // Assuming we want to show remaining credits or pending requests. 
            // Let's show pending requests count for now, or total approved.
            // Or if the API returns a balance object.
            // Fallback to length of active leaves.
            const leaveBalance = leaves.length; 

            setStats({
                present,
                absent,
                late,
                reports: 0, // Placeholder
                leaves: leaveBalance
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    fetchStats();
  }, [user]);

  const handleLogout = useCallback(async () => {
  try {
    await api.post("/logout", {}, { withCredentials: true });
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    navigate("/login");
  } 
   catch (error) {
    console.error("Logout failed:", error);
    // Fallback: still clear local data just in case
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    navigate("/login");
  }
  }, [navigate]);

  const handleNavigate = useCallback((path) => {
    if (path === 'dashboard') {
      navigate('/employee-dashboard');
    } else {
      navigate(`/employee-dashboard/${path}`);
    }
  }, [navigate]);

  const NAV_ITEMS = useMemo(() => [
    { name: 'Dashboard', icon: LayoutDashboard, action: 'dashboard' },
    { 
      name: 'Timekeeping',
      icon: CheckSquare,
      children: [
        { name: 'Attendance', action: 'attendance' },
        { name: 'Calendar', action: 'calendar' },
        { name: 'Daily Time Record', action: 'daily-time-record' },
        { name: 'DTR Corrections', action: 'dtr-corrections' },
        { name: 'Leave Request', action: 'leave-request' },
        { name: 'Leave Forms', action: 'leave-forms' },
        { name: 'Schedule', action: 'schedule' },
        { name: 'Undertime Request', action: 'undertime-request' },
      ],
    },
    { name: 'Performance', icon: Clock, action: 'performance' },
    { name: 'Reports', icon: FileText, action: 'reports' },
    { name: 'Profile', icon: User, action: 'profile' },
  ], []);

  const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen), [sidebarOpen]);

  const statCards = useMemo(() => [
    { icon: CheckSquare, title: "Present Days", value: stats.present, loading: loadingStats, delay: 0.1 },
    { icon: CheckSquare, title: "Absent Days", value: stats.absent, loading: loadingStats, delay: 0.15 },
    { icon: Clock, title: "Late Arrivals", value: stats.late, loading: loadingStats, delay: 0.25, action: 'late-arrivals' },
    { icon: FileText, title: "Reports Filed", value: stats.reports, loading: loadingStats, delay: 0.2 },
    { icon: CalendarIcon, title: "Leave Balance", value: stats.leaves, loading: loadingStats, delay: 0.3 },
  ], [stats, loadingStats]);

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800">
      <Sidebar isOpen={sidebarOpen} navItems={NAV_ITEMS} onLogout={handleLogout} onSectionChange={handleNavigate} />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="p-6 overflow-y-auto">
          {isDashboardHome ? (
            <>
              <WelcomeBanner userName={user?.name} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {statCards.map((card) => (
                  <StatCard 
                    key={card.title} 
                    icon={card.icon} 
                    title={card.title} 
                    value={card.value}
                    loading={card.loading}
                  />
                ))}
              </div>
              <div className="bg-[#F8F9FA] rounded-lg shadow-sm border border-[#34645c] p-8">
                <div className="grid grid-cols-3 gap-6">
                  <ScheduleSection />
                  <EventsAndHolidays />
                  <AnnouncementSection />
                </div>
              </div>
            </>
          ) : (
            <Outlet context={{ sidebarOpen }} />
          )}
          </main>
      </div>
    </div>
  );
}
