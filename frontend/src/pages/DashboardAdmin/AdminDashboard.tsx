import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Standardizing Aliased Imports
import { useAuth } from "@hooks/useAuth";
import { attendanceApi } from "@api/attendanceApi";
import { useUIStore } from "@/stores/uiStore";

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

import ExpiringContractsWidget from "../../features/Dashboard/components/ExpiringContractsWidget";
import RegularizationWidget from "../../features/Dashboard/components/RegularizationWidget";

// Icons
import { 
  LayoutDashboard, Clock, Users, Briefcase, 
  Award, Settings, Mail, MessageCircle, LucideIcon,
  Wallet
} from "lucide-react";

// --- Interfaces ---

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role?: string;
  department_id?: number;
  department_name?: string;
  avatar?: string;
}

export interface StatCardData {
  title: string;
  data: number;
}

export interface Employee {
  id: number;
  first_name?: string;
  last_name?: string;
  name: string; // Added to match child component requirements
  email?: string;
  department_name?: string;
  department?: string; // Added for compatibility
  status?: string;
  [key: string]: any; // Allow for other fields like timeIn, lateBy, etc.
}

export interface EmployeeLists {
  present: Employee[];
  absent: Employee[];
  late: Employee[];
  onLeave: Employee[];
  hired: Employee[];
}

export interface NavItem {
  name: string;
  icon?: LucideIcon;
  action: string; 
  children?: NavItem[];
}

interface DashboardHomeProps {
  user: User;
  statsCards: StatCardData[];
  handleStatCardClick: (stat: StatCardData) => void;
  activeTable: string | null;
  setActiveTable: (table: string | null) => void;
  employeeLists: EmployeeLists;
}

// --- Sub-Component: Dashboard Home ---

const DashboardHome: React.FC<DashboardHomeProps> = React.memo(({ 
  user, 
  statsCards, 
  handleStatCardClick, 
  activeTable, 
  setActiveTable, 
  employeeLists 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 to-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full overflow-hidden text-gray-800 transition-all duration-300">
      <WelcomeBanner user={user} />
      
      <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <div className="relative mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {statsCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              data={stat.data}
              onClick={() => handleStatCardClick(stat)}
              isActive={activeTable === stat.title}
            />
          ))}
        </div>

        {/* Overlay Tables with smooth transitions */}
        {activeTable && (
          <div className="absolute inset-0 top-0 bg-white/95 p-6 rounded-2xl shadow-2xl border border-gray-100 z-20 h-[34rem] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/10 py-2">
              <h3 className="text-lg font-bold text-gray-900">{activeTable} Employees</h3>
            </div>
            {activeTable === "Present" && <PresentTable onClose={() => setActiveTable(null)} employees={employeeLists.present} />}
            {activeTable === "Absent" && <AbsentTable onClose={() => setActiveTable(null)} employees={employeeLists.absent} />}
            {activeTable === "Late" && <LateTable onClose={() => setActiveTable(null)} employees={employeeLists.late} />}
            {activeTable === "On-Leave" && <LeaveTable onClose={() => setActiveTable(null)} />}
            {activeTable === "Hired" && <HiredTable onClose={() => setActiveTable(null)} employees={employeeLists.hired} />}
          </div>
        )}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ExpiringContractsWidget />
        <RegularizationWidget />
      </div>

      <CombinedSection />
    </div>
  );
});

// --- Main Component: HDashboard ---

export default function HDashboard(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- State Management ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Use Global UI Store for Sidebar Sync
  const sidebarOpen = useUIStore((state: any) => state.sidebarOpen);
  const setSidebarOpenStore = useUIStore((state: any) => state.setSidebarOpen);
  
  // Wrapper to match React.Dispatch<React.SetStateAction<boolean>> signature for Header
  const setSidebarOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
      if (typeof value === 'function') {
          setSidebarOpenStore(value(sidebarOpen));
      } else {
          setSidebarOpenStore(value);
      }
  }, [sidebarOpen, setSidebarOpenStore]);

  const [activeTable, setActiveTable] = useState<string | null>(null);

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const response = await attendanceApi.getDashboardStats();
      return response.data?.data;
    }
  });

  const stats = useMemo(() => ({
    present: dashboardData?.counts?.present || 0,
    absent: dashboardData?.counts?.absent || 0,
    late: dashboardData?.counts?.late || 0,
    leave: dashboardData?.counts?.onLeave || 0,
    hired: dashboardData?.counts?.hired || 0
  }), [dashboardData]);

  const employeeLists = useMemo(() => {
    const processList = (list: any[]): Employee[] => (list || []).map(emp => ({
      ...emp,
      name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      department: emp.department || emp.department_name,
    }));

    return {
      present: processList(dashboardData?.lists?.present),
      absent: processList(dashboardData?.lists?.absent),
      late: processList(dashboardData?.lists?.late),
      onLeave: processList(dashboardData?.lists?.onLeave),
      hired: processList(dashboardData?.lists?.hired)
    };
  }, [dashboardData]);

  const isDashboardHome = useMemo(() => 
    location.pathname === "/admin-dashboard" || location.pathname === "/admin-dashboard/", 
  [location.pathname]);

  // --- Handlers ---
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleNavigate = useCallback((action: string): void => {
    if (action === "dashboard") {
      navigate("/admin-dashboard");
    } else {
      // Map actions to specific routes precisely
      const route = action.startsWith("recruitment") ? action : action.replace(/_/g, "-");
      navigate(`/admin-dashboard/${route}`);
    }
  }, [navigate]);

  // --- Navigation Definition ---
  const navItems: NavItem[] = useMemo(() => [
    { name: "Dashboard", icon: LayoutDashboard, action: "dashboard" },
    {
      name: "Timekeeping",
      icon: Clock,
      action: "timekeeping",
      children: [
        { name: "Attendance", action: "attendance" },
        { name: "Calendar", action: "calendar" },
        { name: "Daily Time Record", action: "daily-time-record" },
        { name: "Leave Request", action: "leave-request" },
      ],
    },
    { name: "Employee Management", icon: Users, action: "management" },
    { 
      name: "Recruitment", 
      icon: Briefcase,
      action: "recruitment",
      children: [
        { name: "Job Postings", action: "recruitment/jobs" },
        { name: "Applicant List", action: "recruitment/applicants" },
        { name: "Interview Pipeline", action: "recruitment/interviews" },
      ]
    },
    { name: "Performance Evaluation", icon: Award, action: "performance-reviews" },
    {
      name: "Settings",
      icon: Settings,
      action: "settings",
      children: [
        { name: "User Profile", action: "profile" },
        { name: "Biometrics Monitor", action: "biometrics-monitor" },
        { name: "Biometrics Enrollment", action: "biometrics-enrollment" },
        { name: "Biometrics Logs", action: "biometrics-logs" },
      ],
    },
    { name: "Compensation", icon: Wallet, action: "compensation" },
  ], []);

  const statsCards: StatCardData[] = useMemo(() => [
    { title: "Present", data: stats.present },
    { title: "Absent", data: stats.absent },
    { title: "Late", data: stats.late },
    { title: "On-Leave", data: stats.leave },
    { title: "Hired", data: stats.hired },
  ], [stats]);

  const handleStatCardClick = useCallback((stat: StatCardData): void => {
    setActiveTable(prev => prev === stat.title ? null : stat.title);
  }, []);

  // --- Auth Guard Rendering ---
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-gray-900 font-sans antialiased overflow-hidden">
      <Sidebar
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        handleLogout={handleLogout}
        onSectionChange={handleNavigate}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
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
            <div className="">
              <Outlet context={{ sidebarOpen }} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}