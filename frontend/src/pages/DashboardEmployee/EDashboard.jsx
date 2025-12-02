import { useState, useEffect, useCallback, useMemo } from "react";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LayoutDashboard, CheckSquare, Clock, FileText, User, Calendar as CalendarIcon } from 'lucide-react';
import Sidebar from "../../components/Custom/DashboardEmployeeComponents/Sidebar";
import Header from "../../components/Custom/DashboardEmployeeComponents/Header";
import WelcomeBanner from "../../components/Custom/DashboardEmployeeComponents/WelcomeBanner";
import StatCard from "../../components/Custom/DashboardEmployeeComponents/StatCard";
import EmployeeCombinedSection from "../../components/Custom/DashboardEmployeeComponents/EmployeeCombinedSection";
import EmployeePresentTable from "../../components/Custom/DashboardEmployeeComponents/tables/EmployeePresentTable";
import EmployeeAbsentTable from "../../components/Custom/DashboardEmployeeComponents/tables/EmployeeAbsentTable";
import EmployeeLateTable from "../../components/Custom/DashboardEmployeeComponents/tables/EmployeeLateTable";
import EmployeeLeaveTable from "../../components/Custom/DashboardEmployeeComponents/tables/EmployeeLeaveTable";
import EmployeeReportsTable from "../../components/Custom/DashboardEmployeeComponents/tables/EmployeeReportsTable";
import LoadingScreen from "../../components/Custom/DashboardEmployeeComponents/LoadingScreen";
import api from "../../api/axios"; 
import { attendanceApi } from "../../api/attendanceApi";
import { leaveApi } from "../../api/leaveApi"; 

import ClockInWidget from "../../components/Custom/DashboardEmployeeComponents/ClockInWidget";

// Dashboard Home Component for Employee
const EmployeeDashboardHome = ({ user, statsCards, handleStatCardClick, activeTable, setActiveTable, refreshStats }) => (
  <>
    <WelcomeBanner userName={user?.name} />
    <ClockInWidget onStatusChange={refreshStats} />
    <div className="relative mb-8">
      <div className="grid grid-cols-5 gap-4">
        {statsCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            data={stat.data}
            onClick={() => handleStatCardClick(stat)}
          />
        ))}
      </div>
      {activeTable && (
        <div className="absolute inset-0 bg-[#F8F9FA] p-6 rounded-lg shadow-md border border-gray-100 z-10 h-[32rem] overflow-y-auto">
          {activeTable === "Present" && <EmployeePresentTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Absent" && <EmployeeAbsentTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Late" && <EmployeeLateTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Leave" && <EmployeeLeaveTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Reports" && <EmployeeReportsTable onClose={() => setActiveTable(null)} />}
        </div>
      )}
    </div>
    <EmployeeCombinedSection />
  </>
);



export default function EmployeeDashboard() {
  
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTable, setActiveTable] = useState(null);
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

  const fetchStats = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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

  const handleStatCardClick = useCallback((stat) => {
    const tableMap = {
      "Present Days": "Present",
      "Absent Days": "Absent",
      "Late Arrivals": "Late",
      "Leave Balance": "Leave",
      "Reports Filed": "Reports",
    };
    setActiveTable(tableMap[stat.title] || null);
  }, []);

  const statCards = useMemo(() => [
    { title: "Present Days", data: Array(stats.present).fill({}), action: "present" },
    { title: "Absent Days", data: Array(stats.absent).fill({}), action: "absent" },
    { title: "Late Arrivals", data: Array(stats.late).fill({}), action: "late" },
    { title: "Reports Filed", data: Array(stats.reports).fill({}), action: "reports" },
    { title: "Leave Balance", data: Array(stats.leaves).fill({}), action: "leave" },
  ], [stats]);

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800">
      <Sidebar isOpen={sidebarOpen} navItems={NAV_ITEMS} onLogout={handleLogout} onSectionChange={handleNavigate} />
      <div className="flex-1 flex flex-col">
        <Header 
            onToggleSidebar={toggleSidebar} 
            user={user}
        />

        <main className="p-7 overflow-y-auto relative">
          {isDashboardHome ? (
            <EmployeeDashboardHome
              user={user}
              statsCards={statCards}
              handleStatCardClick={handleStatCardClick}
              activeTable={activeTable}
              setActiveTable={setActiveTable}
              refreshStats={fetchStats}
            />
          ) : (
            <Outlet context={{ sidebarOpen }} />
          )}
          </main>
      </div>
    </div>
  );
}
