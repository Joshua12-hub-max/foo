import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet } from "react-router-dom";
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

export default function EmployeeDashboard() {
  
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const isDashboardHome = location.pathname === "/employee-dashboard" || location.pathname === "/employee-dashboard/";

  useEffect(() => 
  {const storedUser = localStorage.getItem("user");
    if (storedUser) {
          setUser(JSON.parse(storedUser));
      } else {navigate("/login");}
  }, [navigate]);

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
        { name: 'Undertime Form', action: 'undertime-form' },
      ],
    },
    { name: 'Performance', icon: Clock, action: 'performance' },
    { name: 'Reports', icon: FileText, action: 'reports' },
    { name: 'Profile', icon: User, action: 'profile' },
  ], []);

  const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen), [sidebarOpen]);

  const statCards = useMemo(() => [
    { icon: CheckSquare, title: "Present Days", delay: 0.1 },
    { icon: CheckSquare, title: "Absent Days", delay: 0.15 },
    { icon: Clock, title: "Late Arrivals", delay: 0.25, action: 'late-arrivals' },
    { icon: FileText, title: "Reports Filed", delay: 0.2 },
    { icon: CalendarIcon, title: "Leave Balance", delay: 0.3 },
  ], []);

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
              <div className="grid grid-cols-5 gap-4 mb-8">
                {statCards.map((card) => (
                  <StatCard key={card.title} icon={card.icon} title={card.title} />
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
