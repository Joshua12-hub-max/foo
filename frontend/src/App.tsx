import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "@components/ErrorBoundary"; 
import SEO from "@/components/Global/SEO";

// Static imports for core shell and priority pages to improve LCP
const AdminDashboard = lazy(() => import("./pages/DashboardAdmin/AdminDashboard"));
const ChatDashboard = lazy(() => import("./pages/DashboardAdmin/ChatDashboard"));
import LeaveRequestHR from "./pages/TimekeepingAdmin/adminLeaverequest";

// Lazy load other dashboards 
const EmployeeDashboard = lazy(() => import("./pages/DashboardEmployee/EmployeeDashboard"));

//lazy load timekeepingAdminpages
const Attendance = lazy(() => import("./pages/TimekeepingAdmin/adminAttendance"));
const HRCalendar = lazy(() => import("./pages/TimekeepingAdmin/adminCalendar"));
const DailyTimeRecord = lazy(() => import("./pages/TimekeepingAdmin/adminDailyTimeRecord"));
const DTRCorrections = lazy(() => import("./pages/TimekeepingAdmin/adminDTRCorrections"));


//Settings Admin Pages
const BiometricsLogsUI = lazy(() => import("./pages/SettingsAdmin/BiometricsLogs"));

const DepartmentList = lazy(() => import("./pages/EmployeeManagementAdmin/DepartmentListPage"));
const DepartmentDetail = lazy(() => import("./pages/EmployeeManagementAdmin/DepartmentDetail"));
const EmployeeList = lazy(() => import("./pages/EmployeeManagementAdmin/EmployeeDirectoryPage"));
const PerformanceCriteria = lazy(() => import("./pages/PerformanceManagement/PerformanceCriteria"));
const PerformanceEvaluationDashboard = lazy(() => import("./pages/PerformanceManagement/PerformanceEvaluationDashboard"));
const ReviewCycles = lazy(() => import("./pages/PerformanceManagement/ReviewCycles"));
const ReviewForm = lazy(() => import("./pages/PerformanceManagement/ReviewForm"));
const EvaluationHistory = lazy(() => import("./pages/PerformanceManagement/EvaluationHistory"));

const EmployeeProfile = lazy(() => import("./pages/EmployeeManagementAdmin/EmployeeProfilePage"));
const EmployeeMemos = lazy(() => import("./pages/EmployeeManagementAdmin/AdminMemoPage"));
const PlantillaManagement = lazy(() => import("./pages/EmployeeManagementAdmin/PlantillaManagementPage"));
const OrgChart = lazy(() => import("./pages/EmployeeManagementAdmin/OrgChartPage"));
const CentralizedManagement = lazy(() => import("./pages/EmployeeManagementAdmin/EmployeeManagementHub"));
const AdminRegister = lazy(() => import("./pages/EmployeeManagementAdmin/AdminRegister"));

// Recruitment Pages
const JobPosting = lazy(() => import("./pages/Recruitment/JobPosting"));
const ApplicantList = lazy(() => import("./pages/Recruitment/ApplicantList"));
const InterviewKanban = lazy(() => import("./pages/Recruitment/InterviewKanban"));
const InquiriesPage = lazy(() => import("./pages/Recruitment/InquiriesPage"));
const LiveSupportPage = lazy(() => import("./pages/Recruitment/LiveSupportPage"));
const SecurityAuditPage = lazy(() => import("./pages/Recruitment/SecurityAuditPage"));



// Public Career Pages
const Careers = lazy(() => import("./pages/Public/Careers"));
const JobDetail = lazy(() => import("./pages/Public/JobDetail"));
const Home = lazy(() => import("./pages/Public/Home"));
const About = lazy(() => import("./pages/Public/About"));
const Contact = lazy(() => import("./pages/Public/Contact"));



// Lazy load employeeTimekeepingpages
const EmployeeCalendar = lazy(() => import("./pages/TimekeepingEmployee/EmployeeCalendar")); 
const EmployeeDailyTimeRecord = lazy(() => import("./pages/TimekeepingEmployee/EmployeeDailyTimeRecord"));
const LeaveRequest = lazy(() => import("./pages/TimekeepingEmployee/EmployeeLeaveRequest"));
const EmployeeDepartment = lazy(() => import("./pages/EmployeeManagementEmployee/MyDepartmentPage"));
const EmployeeMyProfile = lazy(() => import("./pages/EmployeeManagementEmployee/MyProfilePage"));
const MyProfile = lazy(() => import("./pages/Settings/MyProfile"));


const EmployeeMyMemos = lazy(() => import("./pages/EmployeeManagementEmployee/MyMemosPage"));
const EmployeeReviews = lazy(() => import("./pages/PerformanceManagement/EmployeeReviews"));
const InternalPolicies = lazy(() => import("./pages/InternalPolicies/InternalPoliciesPage"));
// Loading fallback component


// ang page loader na ito ay when the component is display loading message on the screen
import { useAuthStore } from '@/stores';
import { useAuth } from "@hooks/useAuth";

//lazy load authentication
const Login = lazy(() => import("./Authentication/Login"));
const SetupPortal = lazy(() => import("./Authentication/SetupPortal"));
const VerifyAccount = lazy(() => import("./Authentication/VerifyAccount"));
const ForgotPassword = lazy(() => import("./Authentication/ForgotPassword"));
const VerifyApplicant = lazy(() => import("./Authentication/VerifyApplicant"));
const TestBio = lazy(() => import("./pages/TestBio"));

/** ProtectedRoute — restricts access to allowed roles */
/** ProtectedRoute — restricts access to allowed roles */
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!user) {

    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toLowerCase() || '';
  const normalizedAllowedRoles = allowedRoles ? allowedRoles.map(r => r.toLowerCase()) : [];

  if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {

    if (userRole === "employee") {
      return <Navigate to="/employee-dashboard" replace />;
    }
    if (userRole === "human resource" || userRole === "administrator") {
      // Don't auto-redirect them if they are actively trying to access the employee dashboard
      if (!window.location.pathname.startsWith('/employee-dashboard')) {
        return <Navigate to="/admin-dashboard" replace />;
      }
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

/** PublicRoute — redirects logged-in users to their dashboard */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user) {
    const userRole = user?.role?.toLowerCase() || '';
    if (userRole === "employee") return <Navigate to="/employee-dashboard" replace />;
    if (userRole === "administrator" || userRole === "human resource") return <Navigate to="/admin-dashboard" replace />;
  }
  
  return children;
};

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-gray-500">Loading...</div>
  </div>
);

/** SetupRoute — specifically for the initialization portal */
const SetupRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user) {
    const role = user.role?.toLowerCase();
    // Block regular employees and department heads from setup
    if (role === "employee" || role === "department head") {
      return <Navigate to="/employee-dashboard" replace />;
    }
    // Human Resource and Administrator are allowed to proceed to the portal
    // if it's still available (internal logic in SetupPortal handle this)
  }

  return children;
};

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const loading = useAuthStore((state) => state.isLoading);
  const setPortalView = useAuthStore((state) => state.setPortalView);

  useEffect(() => {
    // 100% PERSISTENCE FIX: Sync Portal View state with URL for Admin/HR users on reload
    const path = window.location.pathname;
    if (path.startsWith('/employee-dashboard')) {
        setPortalView(true);
    } else if (path.startsWith('/admin-dashboard')) {
        setPortalView(false);
    }

    checkAuth();
    
    // Cross-tab authentication synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth, setPortalView]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Routes>
      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <SEO title="Login" />
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          </PublicRoute>
        } 
      />

       

        {/* Universal Public Routes (Accessible by everyone) */}
        <Route
          path="/careers"
          element={
            <Suspense fallback={<PageLoader />}>
              <SEO title="Home | Careers" />
              <Home />
            </Suspense>
          }
        />
        <Route
          path="/careers/jobs"
          element={
            <Suspense fallback={<PageLoader />}>
              <SEO title="Job Openings" />
              <Careers />
            </Suspense>
          }
        />
        <Route
          path="/careers/about"
          element={
            <Suspense fallback={<PageLoader />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="/careers/contact"
          element={
            <Suspense fallback={<PageLoader />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="/careers/job/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <JobDetail />
            </Suspense>
          }
        />

        {/* Public routes */}
        <Route
          path="/setup-portal"
          element={
            <SetupRoute>
              <Suspense fallback={<PageLoader />}>
                <SetupPortal />
              </Suspense>
            </SetupRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <Login />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-account"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <VerifyAccount />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-applicant"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <SEO title="Verify Applicant" />
                <VerifyApplicant />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <ForgotPassword />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={<Navigate to="/forgot-password" replace />}
        />

        {/* Protected routes - Admin/HR Dashboard with nested routes */}
        <Route
          path="/admin-dashboard"
          element={
              <ProtectedRoute allowedRoles={["administrator", "human resource"]}>
                <SEO title="Admin Dashboard" />
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
          }
        >
          {/* Nested routes with lazy loading */}
          <Route
            path="attendance"
            element={
              <Suspense fallback={<PageLoader />}>
                <Attendance />
              </Suspense>
            }
          />
          <Route
            path="biometrics-monitor"
            element={<Navigate to="/admin-dashboard/biometrics-logs" replace />}
          />
          <Route
            path="calendar"
            element={
              <Suspense fallback={<PageLoader />}>
                <HRCalendar />
              </Suspense>
            }
          />
          <Route
            path="daily-time-record"
            element={
              <Suspense fallback={<PageLoader />}>
                <DailyTimeRecord />
              </Suspense>
            }
          />
          <Route
            path="dtr-corrections"
            element={
              <Suspense fallback={<PageLoader />}>
                <DTRCorrections />
              </Suspense>
            }
          />

          <Route
            path="leave-request"
            element={<LeaveRequestHR />}
          />


          <Route
            path="biometrics-logs"
            element={
              <Suspense fallback={<PageLoader />}>
                <BiometricsLogsUI/>
              </Suspense>
            }
          />

          <Route
            path="departments"
            element={
              <Suspense fallback={<PageLoader />}>
                <DepartmentList />
              </Suspense>
            }
          />
          <Route
            path="departments/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <DepartmentDetail />
              </Suspense>
            }
          />
          <Route
            path="employees"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeList />
              </Suspense>
            }
          />
          <Route
            path="register"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminRegister />
              </Suspense>
            }
          />
          <Route
            path="employee-memos"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeMemos />
              </Suspense>
            }
          />
          <Route
            path="plantilla"
            element={
              <Suspense fallback={<PageLoader />}>
                <PlantillaManagement />
              </Suspense>
            }
          />
          <Route
            path="org-chart"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrgChart />
              </Suspense>
            }
          />
          <Route
            path="management"
            element={
              <Suspense fallback={<PageLoader />}>
                <CentralizedManagement />
              </Suspense>
            }
          />
          <Route
            path="recruitment/jobs"
            element={
              <Suspense fallback={<PageLoader />}>
                <JobPosting />
              </Suspense>
            }
          />
          <Route
            path="recruitment/applicants"
            element={
              <Suspense fallback={<PageLoader />}>
                <ApplicantList />
              </Suspense>
            }
          />
          <Route
            path="recruitment/interviews"
            element={
              <Suspense fallback={<PageLoader />}>
                <InterviewKanban />
              </Suspense>
            }
          />
          <Route
            path="recruitment/inquiries"
            element={
              <Suspense fallback={<PageLoader />}>
                <InquiriesPage />
              </Suspense>
            }
          />
          <Route
            path="recruitment/support"
            element={
              <Suspense fallback={<PageLoader />}>
                <LiveSupportPage />
              </Suspense>
            }
          />
          <Route
            path="recruitment/audit"
            element={
              <Suspense fallback={<PageLoader />}>
                <SecurityAuditPage />
              </Suspense>
            }
          />

          <Route
            path="performance-criteria"
            element={
              <Suspense fallback={<PageLoader />}>
                <PerformanceCriteria />
              </Suspense>
            }
          />
          <Route
            path="performance-reviews"
            element={
              <Suspense fallback={<PageLoader />}>
                <PerformanceEvaluationDashboard />
              </Suspense>
            }
          />
          <Route
            path="performance/cycles"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReviewCycles />
              </Suspense>
            }
          />
          <Route
            path="performance/reviews/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReviewForm />
              </Suspense>
            }
          />
          <Route
            path="performance/reviews/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReviewForm />
              </Suspense>
            }
          />
          <Route
            path="performance/history"
            element={
              <Suspense fallback={<PageLoader />}>
                <EvaluationHistory />
              </Suspense>
            }
          />

          <Route
            path="employees/:id/profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeProfile />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <MyProfile />
              </Suspense>
            }
          />
          <Route
            path="internal-policies"
            element={
              <Suspense fallback={<PageLoader />}>
                <InternalPolicies />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<PageLoader />}>
                <ChatDashboard />
              </Suspense>
            }
          />
        </Route>

        {/* Protected routes - Employee Dashboard */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee", "administrator", "human resource"]}>
              <SEO title="Employee Dashboard" />
              <Suspense fallback={<PageLoader />}>
                <EmployeeDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        >
          {/* Nested employee routes */}

          <Route
            path="calendar"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeCalendar />
              </Suspense>
            }
          />
          <Route
            path="daily-time-record"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeDailyTimeRecord/>
              </Suspense>
            }
          /> 
 
          <Route
            path="leave-request"
            element={
              <Suspense fallback={<PageLoader />}>
                <LeaveRequest />
              </Suspense>
            }
          />



          <Route
            path="profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <MyProfile />
              </Suspense>
            }
          />

          <Route
            path="my-department"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeDepartment />
              </Suspense>
            }
          />
          <Route
            path="my-memos"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeMyMemos />
              </Suspense>
            }
          />
          <Route
            path="my-profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeMyProfile />
              </Suspense>
            }
          />

          {/* Performance Evaluation Routes */}
          <Route
            path="performance"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeReviews />
              </Suspense>
            }
          />
          <Route
            path="performance/reviews/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReviewForm />
              </Suspense>
            }
          />
          <Route
            path="internal-policies"
            element={
              <Suspense fallback={<PageLoader />}>
                <InternalPolicies />
              </Suspense>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="/test-bio" element={<TestBio />} /> 
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

        </Router>
  );
}
