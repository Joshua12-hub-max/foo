import { useState, useEffect, useCallback, useMemo } from "react";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { LayoutDashboard, CheckSquare, Clock, FileText, User, Calendar as CalendarIcon, Settings, Building2, Award } from 'lucide-react';
import Sidebar from "@components/Custom/DashboardEmployeeComponents/Sidebar";
import Header from "@components/Custom/DashboardEmployeeComponents/Header";
import WelcomeBanner from "@components/Custom/DashboardEmployeeComponents/WelcomeBanner";
import StatCard from "@components/Custom/DashboardEmployeeComponents/StatCard";
import EmployeeCombinedSection from "@components/Custom/DashboardEmployeeComponents/EmployeeCombinedSection";
import EmployeePresentTable from "@components/Custom/DashboardEmployeeComponents/tables/EmployeePresentTable";
import EmployeeAbsentTable from "@components/Custom/DashboardEmployeeComponents/tables/EmployeeAbsentTable";
import EmployeeLateTable from "@components/Custom/DashboardEmployeeComponents/tables/EmployeeLateTable";
import EmployeeLeaveTable from "@components/Custom/DashboardEmployeeComponents/tables/EmployeeLeaveTable";
import EmployeeReportsTable from "@components/Custom/DashboardEmployeeComponents/tables/EmployeeReportsTable";
import LoadingScreen from "@components/Custom/DashboardEmployeeComponents/LoadingScreen";
import { attendanceApi } from "@api/attendanceApi";
import { leaveApi } from "@api/leaveApi"; 

import ClockInWidget from "@components/Custom/DashboardEmployeeComponents/ClockInWidget";

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
            value={stat.value}
            onClick={stat.clickable !== false ? () => handleStatCardClick(stat) : undefined}
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

  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardHome = location.pathname === "/employee-dashboard" || location.pathname === "/employee-dashboard/";

  const fetchStats = useCallback(async () => {
      if (!user) return;
      try {
          // Fetch logs for current month
          const now = new Date();
          const logsRes = await attendanceApi.getLogs({ 
              month: now.getMonth() + 1, 
              year: now.getFullYear(),
              id: user.id 
          });
          
          // Simple calculation (logic might need adjustment based on actual API response structure)
          const logs = logsRes.data?.data || [];
          const present = logs.filter(l => l.status === 'Present').length;
          const late = logs.filter(l => l.status === 'Late').length;
          // Absent logic might be complex (missing logs vs status='Absent'), assuming API returns it or we rely on just present/late for now.
          const absent = logs.filter(l => l.status === 'Absent').length; 

          // Fetch leave credits
          const creditsRes = await leaveApi.getMyCredits();
          const credits = creditsRes.data?.credits || [];
          
          // Sum up all balances
          const leaveBalance = credits.reduce((sum, credit) => sum + (parseFloat(credit.balance) || 0), 0);

          setStats({
              present,
              absent,
              late,
              reports: 0, // Placeholder
              leaves: leaveBalance
          });
      } catch (error) {
          console.error("Error fetching dashboard stats:", error);
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
        { name: 'Leave Credit', action: 'leave-credit' },
        { name: 'Schedule', action: 'schedule' },
        { name: 'Undertime Request', action: 'undertime-request' },
      ],
    },
    { name: 'Employee Management', icon: Building2, action: 'management' },
    { name: 'Performance Evaluation', icon: Award, action: 'performance' },
    { 
      name: 'Settings',
      icon: Settings,
      children: [
        { name: 'Profile Settings', action: 'profile' },
      ],
    },
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
    { title: "Present Days", value: stats.present, action: "present", clickable: false },
    { title: "Absent Days", value: stats.absent, action: "absent", clickable: false },
    { title: "Late Arrivals", value: stats.late, action: "late", clickable: false },
    { title: "Reports Filed", data: Array(stats.reports).fill({}), action: "reports" },
    { title: "Leave Balance", value: stats.leaves, action: "leave", clickable: false },
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
