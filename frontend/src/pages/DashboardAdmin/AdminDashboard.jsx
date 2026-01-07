import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { attendanceApi } from "@api/attendanceApi";

// Dashboard Components
import Sidebar from "@components/Custom/DashboardAdminComponents/Sidebar";
import Header from "@components/Custom/DashboardAdminComponents/Header";
import WelcomeBanner from "@components/Custom/DashboardAdminComponents/WelcomeBanner";
import StatCard from "@components/Custom/DashboardAdminComponents/StatCard";
import CombinedSection from "@components/Custom/DashboardAdminComponents/CombinedSection";
import PresentTable from "@components/Custom/DashboardAdminComponents/PresentTable";
import AbsentTable from "@components/Custom/DashboardAdminComponents/AbsentTable";
import LateTable from "@components/Custom/DashboardAdminComponents/LateTable";
import LeaveTable from "@components/Custom/DashboardAdminComponents/LeaveTable";
import HiredTable from "@components/Custom/DashboardAdminComponents/HiredTable";

import NotificationMenu from '@components/CustomUI/NotificationMenu';

// Icons
import {LayoutDashboard, Clock, Users, Building2, Briefcase, DollarSign, Award, FileText, Settings} from "lucide-react";

// Dashboard Home Component
const DashboardHome = ({ user, statsCards, handleStatCardClick, activeTable, setActiveTable, employeeLists }) => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300">
    <WelcomeBanner user={user} />
    <hr className="mb-6 h-px bg-gray-200 border-0" />
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
          {activeTable === "Present" && <PresentTable onClose={() => setActiveTable(null)} employees={employeeLists.present} />}
          {activeTable === "Absent" && <AbsentTable onClose={() => setActiveTable(null)} employees={employeeLists.absent} />}
          {activeTable === "Late" && <LateTable onClose={() => setActiveTable(null)} employees={employeeLists.late} />}
          {activeTable === "Leave" && <LeaveTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Hired" && <HiredTable onClose={() => setActiveTable(null)} employees={employeeLists.hired} />}
        </div>
      )}
    </div>
    <CombinedSection />
  </div>
);

export default function HDashboard() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTable, setActiveTable] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on dashboard home
  const isDashboardHome = location.pathname === "/admin-dashboard" || location.pathname === "/admin-dashboard/";

  // Logout handler
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
        action: "management",
      },
      { 
        name: "Recruitment", 
        icon: Briefcase,
        children: [
          { name: "Job Postings", action: "recruitment/jobs" },
          { name: "Applicant List", action: "recruitment/applicants" },
          { name: "Interview Pipeline", action: "recruitment/interviews" },
        ]
      },
      {
        name: "Performance Evaluation",
        icon: Award,
        action: "performance-reviews",
      },
      { name: "Reports", icon: FileText, children: [
          { name: "Department Attendance", action: "department-attendance-reports" },
        ],
      },
      {
        name: "Settings",
        icon: Settings,
        children: [
          { name: "User Profile", action: "profile" },
          { name: "Biometrics Monitor", action: "biometrics-monitor" },
          { name: "Biometrics Enrollment", action: "biometrics-enrollment" },
          { name: "Biometrics Logs", action: "biometrics-logs" },
        ],
      },
    ],
    []
  );

  // Stats state for real data
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    hired: 0
  });

  // Employee lists for tables
  const [employeeLists, setEmployeeLists] = useState({
    present: [],
    absent: [],
    late: [],
    onLeave: [],
    hired: []
  });

  // Fetch real data on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await attendanceApi.getDashboardStats();
        const data = response.data?.data;
        
        if (data) {
          setStats({
            present: data.counts.present || 0,
            late: data.counts.late || 0,
            leave: data.counts.onLeave || 0,
            absent: data.counts.absent || 0,
            hired: data.counts.hired || 0
          });
          
          setEmployeeLists({
            present: data.lists.present || [],
            absent: data.lists.absent || [],
            late: data.lists.late || [],
            onLeave: data.lists.onLeave || [],
            hired: data.lists.hired || []
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error?.message || String(error));
      }
    };
    loadStats();
  }, []);

  // Stats cards configuration with real data
  const statsCards = useMemo(
    () => [
      { title: "Present", data: stats.present },
      { title: "Absent", data: stats.absent },
      { title: "Late", data: stats.late },
      { title: "On-Leave", data: stats.leave },
      { title: "Hired", data: stats.hired },
    ],
    [stats]
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
              employeeLists={employeeLists}
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