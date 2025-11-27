import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import api from "../../api/axios";

// Dashboard Components (stay in HDashboard/dito lang dapat)
import Sidebar from "../../components/Custom/DashboardAdminComponents/Sidebar";
import Header from "../../components/Custom/DashboardAdminComponents/Header";
import WelcomeBanner from "../../components/Custom/DashboardAdminComponents/WelcomeBanner";
import StatCard from "../../components/Custom/DashboardAdminComponents/StatCard";
import CombinedSection from "../../components/Custom/DashboardAdminComponents/CombinedSection";
import PresentTable from "../../components/Custom/DashboardAdminComponents/PresentTable";
import AbsentTable from "../../components/Custom/DashboardAdminComponents/AbsentTable";
import LateTable from "../../components/Custom/DashboardAdminComponents/LateTable";
import LeaveTable from "../../components/Custom/DashboardAdminComponents/LeaveTable";
import HiredTable from "../../components/Custom/DashboardAdminComponents/HiredTable";

import NotificationMenu from '../../components/CustomUI/NotificationMenu';

// Icons remember ito yung kinuha mo sa lucide-react
import {LayoutDashboard, Clock, Users, Building2, Briefcase, DollarSign,Award, FileText, Settings,} from "lucide-react";

// Dashboard Home Component
const DashboardHome = ({ user, statsCards, handleStatCardClick, activeTable, setActiveTable }) => (
  <>
    <WelcomeBanner user={user} />
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
          {activeTable === "Present" && <PresentTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Absent" && <AbsentTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Late" && <LateTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Leave" && <LeaveTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Hired" && <HiredTable onClose={() => setActiveTable(null)} />}
        </div>
      )}
    </div>
    <CombinedSection />
  </>
);

export default function HDashboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTable, setActiveTable] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on dashboard home
  const isDashboardHome = location.pathname === "/admin-dashboard" || location.pathname === "/admin-dashboard/";

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      localStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      navigate("/login");
    } catch (error) {
      console.error("logout failed:", error);
      // Fallback: clear local data
      localStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      navigate("/login");
    }
  }, [navigate]);

  // Navigation handler
  const handleNavigate = useCallback(
    (action) => {
      if (action === "dashboard") {
        navigate("/admin-dashboard");
      } else {
        // Convert action to kebab-case for URL
        const route = action.replace(/_/g, "-");
        navigate(`/admin-dashboard/${route}`);
      }
    },
    [navigate]
  );

  // Navigation items
  const navItems = useMemo(
    () => [
      { name: "Dashboard", icon: LayoutDashboard, action: "dashboard" },
      {
        name: "Timekeeping",
        icon: Clock,
        children: [
          { name: "Attendance", action: "attendance" },
          { name: "Biometrics Monitor", action: "biometrics-monitor" },
          { name: "Calendar", action: "calendar" },
          { name: "Daily Time Record", action: "daily-time-record" },
          { name: "DTR Corrections", action: "dtr-corrections" },
          { name: "Leave Request", action: "leave-request" },
          { name: "Leave Credit", action: "leave-credit" },
          { name: "Schedule", action: "schedule" },
          { name: "Undertime Requests", action: "undertime-requests"},
        ],
      },
      {
        name: "Employee Management",
        icon: Users,
        children: [
          { name: "Role Based Control ", action: "rbac" },
        ],
      },
      { name: "Department", icon: Building2 },
      { name: "Recruitment", icon: Briefcase },
      { name: "Payroll", icon: DollarSign },
      { name: "Performance Evaluation", icon: Award },
      { name: "Reports", icon: FileText },
      {
        name: "Settings",
        icon: Settings,
        children: [
          { name: "Department Profile", action: "profile-settings" },
          { name: "User Profile", action: "account-settings" },
          { name: "Biometrics Logs", action: "biometrics-logs" },
          { name: "Company Policies", action: "company-policies" },
        ],
      },
    ],
    []
  );

  // Stats cards configuration
  const statsCards = useMemo(
    () => [
      { title: "Present", data: [] },
      { title: "Absent", data: [] },
      { title: "Late", data: [] },
      { title: "On-Leave", data: [] },
      { title: "Hired", data: [] },
    ],
    []
  );

  // Handle stat card click
  const handleStatCardClick = useCallback((stat) => {
    const tableMap = {
      Present: "Present",
      Absent: "Absent",
      Late: "Late",
      "On-Leave": "Leave",
      Hired: "Hired",
    };
    setActiveTable(tableMap[stat.title] || null);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800">
      <Sidebar
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        handleLogout={handleLogout}
        setSidebarOpen={setSidebarOpen}
        onSectionChange={handleNavigate}
      />
      <div className="flex-1 flex flex-col">
        <Header
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main className="p-7 overflow-y-auto relative">
          {/* Dashboard Home View */}
          {isDashboardHome ? (
            <DashboardHome
              user={user}
              statsCards={statsCards}
              handleStatCardClick={handleStatCardClick}
              activeTable={activeTable}
              setActiveTable={setActiveTable}
            />
          ) : (
            /* Nested Route Content via Outlet */
            <Outlet context={{ sidebarOpen }} />
          )}
        </main>
      </div>
    </div>
  );
}