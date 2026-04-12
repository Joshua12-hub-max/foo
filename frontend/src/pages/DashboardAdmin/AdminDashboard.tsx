import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Standardizing Aliased Imports
import { useAuth } from "@hooks/useAuth";
import { attendanceApi, DashboardStatsResponse, EmployeeStats } from "@api/attendanceApi";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores";
import { User } from "@/types";
import { inquiryApi } from "@api/inquiryApi";
import { chatApi } from "@api/chatApi";

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
  Award, Settings, LucideIcon
} from "lucide-react";

// --- Interfaces ---

// StatCardData interface
export interface StatCardData {
  title: string;
  data: number;
}

export interface DashboardEmployee extends EmployeeStats {
  name: string;
  department: string;
  status?: string;
  timeIn?: string;
  timeOut?: string;
  date?: string;
  position?: string;
  jobTitle?: string;
  dateHired?: string;
  [key: string]: unknown;
}

export interface EmployeeLists {
  present: DashboardEmployee[];
  absent: DashboardEmployee[];
  late: DashboardEmployee[];
  onLeave: DashboardEmployee[];
  hired: DashboardEmployee[];
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
  searchQuery: string;
}

// --- Sub-Component: Dashboard Home ---

const DashboardHome: React.FC<DashboardHomeProps> = React.memo(({ 
  user, 
  statsCards, 
  handleStatCardClick, 
  activeTable, 
  setActiveTable, 
  employeeLists,
  searchQuery
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--zed-bg-light)] rounded-[var(--radius-sm)] shadow-[var(--zed-shadow-sm)] border border-[var(--zed-border-light)] p-8 w-full overflow-hidden text-[var(--zed-text-dark)] transition-all duration-300">
      <WelcomeBanner user={user} />
      
      <div className="my-8 h-px bg-[var(--zed-border-light)]" />
      
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
          <div className="absolute inset-0 top-0 bg-[var(--zed-bg-light)]/95 backdrop-blur-sm p-6 rounded-[var(--radius-sm)] shadow-[var(--zed-shadow-lg)] border border-[var(--zed-border-light)] z-20 h-[34rem] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--zed-bg-light)]/10 py-2">
              <h3 className="text-lg font-bold text-[var(--zed-text-dark)]">{activeTable} Employees</h3>
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

      <CombinedSection searchQuery={searchQuery} />
    </div>
  );
});

// --- Main Component: HDashboard ---

export default function HDashboard(): React.ReactElement {
  const { user, logout } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // --- State Management ---
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Use Global UI Store for Sidebar Sync
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpenStore = useUIStore((state) => state.setSidebarOpen);

  // Wrapper to match React.Dispatch<React.SetStateAction<boolean>> signature for Header
  const setSidebarOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
      if (typeof value === 'function') {
          setSidebarOpenStore(value(sidebarOpen));
      } else {
          setSidebarOpenStore(value);
      }
  }, [sidebarOpen, setSidebarOpenStore]);

  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState<number>(0);
  const [pendingChatCount, setPendingChatCount] = useState<number>(0);

  // Fetch all pending counts
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [inquiryRes, chatRes] = await Promise.all([
        inquiryApi.getPendingCount(),
        chatApi.getAdminUnreadTotal()
      ]);

      if (inquiryRes.data.success) {
        setPendingInquiriesCount(Number(inquiryRes.data.count || 0));
      }
      if (chatRes.data.success) {
        setPendingChatCount(Number(chatRes.data.count || 0));
      }
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [fetchCounts, isAuthenticated]);
  const { data: dashboardData } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async (): Promise<DashboardStatsResponse['data'] | undefined> => {
      const response = await attendanceApi.getDashboardStats();
      return response.data?.data;
    }
  });

  const stats = useMemo(() => {
    const counts = dashboardData?.counts;
    return {
      present: counts?.present || 0,
      absent: counts?.absent || 0,
      late: counts?.late || 0,
      leave: counts?.onLeave || 0,
      hired: counts?.hired || 0
    };
  }, [dashboardData]);

  const employeeLists = useMemo(() => {
    const processList = (list?: EmployeeStats[]): DashboardEmployee[] => (list || []).map(emp => ({
      ...emp,
      id: Number(emp.id) || 0,
      name: String(emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()),
      department: String(emp.department || emp.departmentName || ''),
    } as DashboardEmployee));

    const lists = dashboardData?.lists;
    return {
      present: processList(lists?.present),
      absent: processList(lists?.absent),
      late: processList(lists?.late),
      onLeave: processList(lists?.onLeave),
      hired: processList(lists?.hired)
    };
  }, [dashboardData]);

  const isDashboardHome = useMemo(() => 
    location.pathname === "/admin-dashboard" || location.pathname === "/admin-dashboard/", 
  [location.pathname]);

  // --- Profile Completeness Check ---
  useEffect(() => {
    if (user?.profileStatus === 'Initial' && location.pathname !== "/admin-dashboard/register") {
      navigate("/admin-dashboard/register?mode=finalize-setup");
    }
  }, [user, navigate, location.pathname]);

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
    {
      name: "Employee Management",
      icon: Users,
      action: "management"
    },
    { 
      name: "Recruitment", 
      icon: Briefcase,
      action: "recruitment",
      count: pendingInquiriesCount + pendingChatCount, // Sum of both notifications
      children: [
        { name: "Job Postings", action: "recruitment/jobs" },
        { name: "Applicant List", action: "recruitment/applicants" },
        { name: "Interview Pipeline", action: "recruitment/interviews" },
        { name: "Live Support Chat", action: "recruitment/support", count: pendingChatCount },
        { name: "Public Inquiries", action: "recruitment/inquiries", count: pendingInquiriesCount },
        { name: "Security Audit Logs", action: "recruitment/audit" },
      ]
    },
    { name: "Performance Evaluation", icon: Award, action: "performance-reviews" },
    {
      name: "Settings",
      icon: Settings,
      action: "settings",
      children: [
        { name: "User Profile", action: "profile" },
        { name: "Biometrics", action: "biometrics-logs" },
      ],
    },
  ], [pendingInquiriesCount, pendingChatCount]);

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
      <div className="h-screen w-full flex items-center justify-center bg-[var(--zed-bg-surface)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--zed-accent)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] font-sans antialiased overflow-hidden selection:bg-[var(--zed-text-dark)] selection:text-white">
      <Sidebar
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        handleLogout={handleLogout}
        onSectionChange={handleNavigate}
        userRole={user?.role}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-premium">
          {isDashboardHome ? (
            <DashboardHome
              user={user}
              statsCards={statsCards}
              handleStatCardClick={handleStatCardClick}
              activeTable={activeTable}
              setActiveTable={setActiveTable}
              employeeLists={employeeLists}
              searchQuery={searchQuery}
            />
          ) : (
            <div className="">
              <Outlet context={{ sidebarOpen, searchQuery }} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}