import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@hooks/useAuth";
import { LayoutDashboard, CheckSquare, FileText, Settings, Award, type LucideIcon } from 'lucide-react';
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
import EventListCard from "@components/Custom/DashboardEmployeeComponents/EventListCard";

import { User } from '@/types';
import { CalendarEvent } from "@/types/calendar";
import { eventApi } from "@api/eventApi";

// Local interface removed, using global User type
// interface User { ... }

interface StatCardData {
  title: string;
  data?: object[];
  value?: number;
  action?: string;
  clickable?: boolean;
}

interface NavItem {
  name: string;
  icon: LucideIcon; // Lucide icon component type
  action?: string;
  children?: { name: string; action: string }[];
}

interface Stats {
  present: number;
  absent: number;
  late: number;
  reports: number;
  leaves: number;
}

interface DashboardHomeProps {
  user: User;
  statsCards: StatCardData[];
  events: CalendarEvent[];
  eventsLoading: boolean;
  handleStatCardClick: (stat: StatCardData) => void;
  activeTable: string | null;
  setActiveTable: (table: string | null) => void;
  refreshStats: () => Promise<void>;
  searchQuery: string;
}

// Dashboard Home Component for Employee
const EmployeeDashboardHome: React.FC<DashboardHomeProps> = ({ user, statsCards, events, eventsLoading, handleStatCardClick, activeTable, setActiveTable, refreshStats, searchQuery }) => (
  <>
    <WelcomeBanner userName={user?.name} />
    <div className="relative mb-8">
      <div className="grid grid-cols-5 gap-4">
        {statsCards.slice(0, 3).map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            data={stat.data}
            value={stat.value}
            onClick={stat.clickable !== false ? () => handleStatCardClick(stat) : undefined}
          />
        ))}
        
        {/* Replace index 3 (Reports Filed) with EventListCard */}
        <EventListCard events={events} isLoading={eventsLoading} />

        {statsCards.slice(3).map((stat) => (
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
        <div className="absolute inset-0 bg-[var(--zed-bg-light)]/95 backdrop-blur-sm p-6 rounded-[var(--radius-sm)] shadow-[var(--zed-shadow-lg)] border border-[var(--zed-border-light)] z-10 h-[32rem] overflow-y-auto animate-in fade-in zoom-in duration-200">
          {activeTable === "Present" && <EmployeePresentTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Absent" && <EmployeeAbsentTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Late" && <EmployeeLateTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Leave" && <EmployeeLeaveTable onClose={() => setActiveTable(null)} />}
          {activeTable === "Reports" && <EmployeeReportsTable onClose={() => setActiveTable(null)} />}
        </div>
      )}
    </div>
    <EmployeeCombinedSection searchQuery={searchQuery} />
  </>
);


export default function EmployeeDashboard(): React.ReactElement {
// ... omitting existing state/effects setup logic ...
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({
    present: 0,
    absent: 0,
    late: 0,
    reports: 0,
    leaves: 0
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardHome = location.pathname === "/employee-dashboard" || location.pathname === "/employee-dashboard/";

  const fetchStats = useCallback(async (): Promise<void> => {
      if (!user) return;
      try {
          // Fetch logs for current month
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          const startDate = firstDay.toISOString().split('T')[0];
          const endDate = lastDay.toISOString().split('T')[0];
          
          const empId = String(user.employeeId || user.id);

          const logsRes = await attendanceApi.getLogs({ 
              startDate, 
              endDate,
              employeeId: empId,
              limit: 100 // Get all logs for the current month for accurate stats
          });
          
          // Precise calculation matching backend logic
          const logs = logsRes.data?.data || [];
          const present = logs.filter((l: { status: string }) => ['Present', 'Present (Late)', 'Late', 'Undertime', 'Late/Undertime'].includes(l.status)).length;
          const late = logs.filter((l: { status: string }) => ['Late', 'Present (Late)', 'Late/Undertime'].includes(l.status)).length;
          const absent = logs.filter((l: { status: string }) => l.status === 'Absent' || l.status === 'No Logs').length; 

          // Fetch leave credits
          const creditsRes = await leaveApi.getMyCredits();
          const credits = creditsRes.data?.credits || [];
          
          // Sum up all balances (handle both string and number for compatibility)
          const leaveBalance = credits.reduce((sum: number, credit: { balance: string | number }) => {
            const balance = typeof credit.balance === 'string' ? parseFloat(credit.balance) : credit.balance;
            return sum + (balance || 0);
          }, 0);

          setStats({
              present,
              absent,
              late,
              reports: 0, 
              leaves: leaveBalance
          });

          // Fetch Events
          try {
            setEventsLoading(true);
            const eventsRes = await eventApi.getEvents();
            const eventsData = eventsRes.data as { events?: CalendarEvent[] };
            if (eventsData && eventsData.events) {
              setEvents(eventsData.events);
            }
          } catch (err) {
            console.error("Error fetching dashboard events:", err);
          } finally {
            setEventsLoading(false);
          }
      } catch (error) {
          console.error("Error fetching dashboard stats:", error);
      }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/login");
  };

  const handleNavigate = useCallback((path: string): void => {
    if (path === 'dashboard') {
      navigate('/employee-dashboard');
    } else {
      navigate(`/employee-dashboard/${path}`);
    }
  }, [navigate]);

  const NAV_ITEMS: NavItem[] = useMemo(() => [
    { name: 'Dashboard', icon: LayoutDashboard, action: 'dashboard' },
    { 
      name: 'Timekeeping',
      icon: CheckSquare,
      children: [
        { name: 'Calendar', action: 'calendar' },
        { name: 'Daily Time Record', action: 'daily-time-record' },
        { name: 'Leave Request', action: 'leave-request' },
      ],
    },
    { name: 'Performance Evaluation', icon: Award, action: 'performance' },
    { name: 'Internal Policies', icon: FileText, action: 'internal-policies' },
    { 
      name: 'Settings',
      icon: Settings,
      children: [
        { name: 'Profile Settings', action: 'profile' },
      ],
    },
  ], []);

  const toggleSidebar = useCallback((): void => setSidebarOpen(!sidebarOpen), [sidebarOpen]);

  const handleStatCardClick = useCallback((stat: StatCardData): void => {
    const tableMap: Record<string, string> = {
      "Present Days": "Present",
      "Absent Days": "Absent",
      "Late Arrivals": "Late",
      "Leave Balance": "Leave",
    };
    setActiveTable(tableMap[stat.title] || null);
  }, []);

  const statCards: StatCardData[] = useMemo(() => [
    { title: "Present Days", value: stats.present, action: "present", clickable: false },
    { title: "Absent Days", value: stats.absent, action: "absent", clickable: false },
    { title: "Late Arrivals", value: stats.late, action: "late", clickable: false },
    { title: "Leave Balance", value: stats.leaves, action: "leave", clickable: false },
  ], [stats]);

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] font-sans antialiased overflow-hidden selection:bg-[var(--zed-text-dark)] selection:text-white">
      <Sidebar isOpen={sidebarOpen} navItems={NAV_ITEMS} onLogout={handleLogout} onSectionChange={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
            onToggleSidebar={toggleSidebar} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        />

        {/* SUSPENSION WARNING BANNER */}
        {user?.employmentStatus === 'Suspended' || (user?.profileStatus as string) === 'Suspended' ? (
          <div className="bg-red-600 text-white px-6 py-4 mx-7 mt-6 rounded-[var(--radius-sm)] shadow-sm border-l-4 border-red-800 flex items-start gap-4 animate-pulse">
            <div className="bg-white/20 p-2 rounded-[var(--radius-sm)]">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wider">Account Suspended</h3>
              <p className="text-red-100 font-medium mt-1">
                Your account is currently under suspension. You have limited access to the portal. 
                You cannot submit requests, update your profile, or perform administrative actions. 
                Please contact Human Resource for more information.
              </p>
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-premium">
          {isDashboardHome ? (
            <EmployeeDashboardHome
              user={user}
              statsCards={statCards}
              events={events}
              eventsLoading={eventsLoading}
              handleStatCardClick={handleStatCardClick}
              activeTable={activeTable}
              setActiveTable={setActiveTable}
              refreshStats={fetchStats}
            />
          ) : (
            <Outlet context={{ sidebarOpen, searchQuery }} />
          )}
          </main>
      </div>
    </div>
  );
}
