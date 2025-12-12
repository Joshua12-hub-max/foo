import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary"; 

//lazy load authentication
const Login = lazy(() => import("./Authentication/Login"));
const Register = lazy(() => import("./Authentication/Register"));
const VerifyEmail = lazy(() => import("./Authentication/VerifyEmail"));
const ForgotPassword = lazy(() => import("./Authentication/ForgotPassword"));
const ResetPassword = lazy(() => import("./Authentication/ResetPassword"));

// Lazy load dashboards 
const AdminDashboard = lazy(() => import("./pages/DashboardAdmin/ADashboard"));
const EmployeeDashboard = lazy(() => import("./pages/DashboardEmployee/EDashboard"));

//lazy load timekeepingAdminpages
const Attendance = lazy(() => import("./pages/TimekeepingAdmin/adminAttendance"));
const HRCalendar = lazy(() => import("./pages/TimekeepingAdmin/adminCalendar"));
const DailyTimeRecord = lazy(() => import("./pages/TimekeepingAdmin/adminDailyTimeRecord"));
const DTRCorrection = lazy(() => import("./pages/TimekeepingAdmin/admindtrCorrection"));
const LeaveRequestHR = lazy(() => import("./pages/TimekeepingAdmin/adminLeaverequest"));
const LeaveCredit = lazy(() => import("./pages/TimekeepingAdmin/adminLeavecredit"));
const Schedule = lazy(() => import("./pages/TimekeepingAdmin/adminSchedule"));
const UndertimeRequests = lazy(() => import("./pages/TimekeepingAdmin/adminUndertimerequest"));
const BiometricsMonitor = lazy(() => import("./pages/TimekeepingAdmin/BiometricsMonitor"));

//Settings Admin Pages
const BiometricsLogsUI = lazy(() => import("./pages/SettingsAdmin/BiometricsLogs"));
const BiometricsEnrollment = lazy(() => import("./pages/SettingsAdmin/BiometricsEnrollment"));
const DepartmentList = lazy(() => import("./pages/EmployeeManagement/Departments/DepartmentList"));
const DepartmentDetail = lazy(() => import("./pages/EmployeeManagement/Departments/DepartmentDetail"));
const EmployeeList = lazy(() => import("./pages/EmployeeManagement/Employees/EmployeeList"));
const PerformanceCriteria = lazy(() => import("./pages/PerformanceManagement/PerformanceCriteria"));
const PerformanceEvaluationDashboard = lazy(() => import("./pages/PerformanceManagement/PerformanceEvaluationDashboard"));
const ReviewCycles = lazy(() => import("./pages/PerformanceManagement/ReviewCycles"));
const ReviewForm = lazy(() => import("./pages/PerformanceManagement/ReviewForm"));
const DraftReviews = lazy(() => import("./pages/PerformanceManagement/DraftReviews"));
const CoachingLog = lazy(() => import("./pages/PerformanceManagement/CoachingLog"));
const DevelopmentPlan = lazy(() => import("./pages/PerformanceManagement/DevelopmentPlan"));
const TrainingNeeds = lazy(() => import("./pages/PerformanceManagement/TrainingNeeds"));

// SPMS Full Compliance Pages (CSC MC 6-2012)
const OPCRManagement = lazy(() => import("./pages/PerformanceManagement/OPCRManagement"));
const IPCRManagement = lazy(() => import("./pages/PerformanceManagement/IPCRManagement"));
const IPCRDetail = lazy(() => import("./pages/PerformanceManagement/IPCRDetail"));
const Appeals = lazy(() => import("./pages/PerformanceManagement/Appeals"));
const PMTDashboard = lazy(() => import("./pages/PerformanceManagement/PMTDashboard"));
const PerformanceNotices = lazy(() => import("./pages/PerformanceManagement/PerformanceNotices"));

const EmployeeProfile = lazy(() => import("./pages/EmployeeManagement/Employees/EmployeeProfile"));
const EmployeeMemos = lazy(() => import("./pages/EmployeeManagement/EmployeeMemos"));
const PlantillaManagement = lazy(() => import("./pages/EmployeeManagement/PlantillaManagement"));

// Recruitment Pages
const JobPosting = lazy(() => import("./pages/Recruitment/JobPosting"));

// Reports Admin Pages
const DepartmentAttendanceReports = lazy(() => import("./pages/ReportsAdmin/DepartmentAttendanceReports"));
const TardinessReport = lazy(() => import("./pages/ReportsAdmin/TardinessReport"));

// Public Career Pages
const Careers = lazy(() => import("./pages/Public/Careers"));
const JobDetail = lazy(() => import("./pages/Public/JobDetail"));



// Lazy load employeeTimekeepingpages
const AttendanceEM = lazy(() => import("./pages/TimekeepingEmployee/EmployeeAttendance"));
const EmployeeCalendar = lazy(() => import("./pages/TimekeepingEmployee/EmployeeCalendar")); 
const LeaveRequest = lazy(() => import("./pages/TimekeepingEmployee/EmployeeLeaveRequest"));
const EmployeeLeavecredit = lazy(() => import("./pages/TimekeepingEmployee/EmployeeLeavecredit"));
const EmployeeDailyTimeRecord = lazy(() => import("./pages/TimekeepingEmployee/EmployeeDailyTimeRecord"));
const EmployeeDtrcorrections = lazy(() => import("./pages/TimekeepingEmployee/EmployeedtrCorrection"));
const EmployeeUndertimeRequest = lazy(() => import("./pages/TimekeepingEmployee/EmployeeUndertimeRequest"));
const EmployeeSchedule = lazy(() => import("./pages/TimekeepingEmployee/EmployeeSchedule"));
const EmployeeDepartment = lazy(() => import("./pages/TimekeepingEmployee/EmployeeDepartment"));
const EmployeeIPCRManagement = lazy(() => import("./pages/PerformanceManagement/EmployeeIPCRManagement"));
const EmployeeIPCRDetail = lazy(() => import("./pages/PerformanceManagement/EmployeeIPCRDetail"));
const EmployeePerformanceReviews = lazy(() => import("./pages/PerformanceManagement/EmployeePerformanceReviews"));
const EmployeeCoachingLog = lazy(() => import("./pages/PerformanceManagement/EmployeeCoachingLog"));
const EmployeeDevelopmentPlan = lazy(() => import("./pages/PerformanceManagement/EmployeeDevelopmentPlan"));
const EmployeeTrainingNeeds = lazy(() => import("./pages/PerformanceManagement/EmployeeTrainingNeeds"));
const MyProfile = lazy(() => import("./pages/Settings/MyProfile"));
const EmployeeNotificationHistory = lazy(() => import("./pages/TimekeepingEmployee/NotificationHistory"));
const EmployeeMyMemos = lazy(() => import("./pages/TimekeepingEmployee/EmployeeMemos"));
// Loading fallback component


// ang page loader na ito ay when the component is display loading message on the screen
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-gray-500">Loading...</div>
  </div>
);

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

/** ProtectedRoute — restricts access to allowed roles */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!user) {

    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toLowerCase();
  const normalizedAllowedRoles = allowedRoles ? allowedRoles.map(r => r.toLowerCase()) : [];

  if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {

    if (userRole === "employee") {
      return <Navigate to="/employee-dashboard" replace />;
    }
    if (userRole === "hr" || userRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

/** PublicRoute — redirects logged-in users to their dashboard */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user) {
    const userRole = user.role.toLowerCase();
    if (userRole === "employee") return <Navigate to="/employee-dashboard" replace />;
    if (userRole === "admin" || userRole === "hr") return <Navigate to="/admin-dashboard" replace />;
  }
  
  return children;
};

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              </PublicRoute>
            } 
          />

        {/* Public Career Pages - Accessible by everyone */}
        <Route
          path="/careers"
          element={
            <Suspense fallback={<PageLoader />}>
              <Careers />
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
          path="/register"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <Register />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <VerifyEmail />
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
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <ResetPassword />
              </Suspense>
            </PublicRoute>
          }
        />

        {/* Protected routes - Admin/HR Dashboard with nested routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
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
            element={
              <Suspense fallback={<PageLoader />}>
                <BiometricsMonitor />
              </Suspense>
            }
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
                <ErrorBoundary>
                  <DTRCorrection />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="leave-request"
            element={
              <Suspense fallback={<PageLoader />}>
                <LeaveRequestHR />
              </Suspense>
            }
          />
          <Route
            path="leave-credit"
            element={
              <Suspense fallback={<PageLoader />}>
                <LeaveCredit />
              </Suspense>
            }
          />
          <Route
            path="schedule"
            element={
              <Suspense fallback={<PageLoader />}>
                <Schedule />
              </Suspense>
            }
          />
          <Route
            path="undertime-requests"
            element={
              <Suspense fallback={<PageLoader />}>
                <UndertimeRequests/>
              </Suspense>
            }
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
            path="biometrics-enrollment"
            element={
              <Suspense fallback={<PageLoader />}>
                <BiometricsEnrollment />
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
            path="recruitment/jobs"
            element={
              <Suspense fallback={<PageLoader />}>
                <JobPosting />
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
            path="performance/drafts"
            element={
              <Suspense fallback={<PageLoader />}>
                <DraftReviews />
              </Suspense>
            }
          />
          <Route
            path="coaching-log"
            element={
              <Suspense fallback={<PageLoader />}>
                <CoachingLog />
              </Suspense>
            }
          />
          <Route
            path="development-plans"
            element={
              <Suspense fallback={<PageLoader />}>
                <DevelopmentPlan />
              </Suspense>
            }
          />
          <Route
            path="training-needs"
            element={
              <Suspense fallback={<PageLoader />}>
                <TrainingNeeds />
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
            path="department-attendance-reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <DepartmentAttendanceReports />
              </Suspense>
            }
          />
          <Route
            path="tardiness-report"
            element={
              <Suspense fallback={<PageLoader />}>
                <TardinessReport />
              </Suspense>
            }
          />
          {/* SPMS Full Compliance Routes */}
          <Route
            path="opcr"
            element={
              <Suspense fallback={<PageLoader />}>
                <OPCRManagement />
              </Suspense>
            }
          />
          <Route
            path="ipcr"
            element={
              <Suspense fallback={<PageLoader />}>
                <IPCRManagement />
              </Suspense>
            }
          />
          <Route
            path="ipcr/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <IPCRDetail />
              </Suspense>
            }
          />
          <Route
            path="appeals"
            element={
              <Suspense fallback={<PageLoader />}>
                <Appeals />
              </Suspense>
            }
          />
          <Route
            path="pmt"
            element={
              <Suspense fallback={<PageLoader />}>
                <PMTDashboard />
              </Suspense>
            }
          />
          <Route
            path="performance-notices"
            element={
              <Suspense fallback={<PageLoader />}>
                <PerformanceNotices />
              </Suspense>
            }
          />

        </Route>

        {/* Protected routes - Employee Dashboard */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <Suspense fallback={<PageLoader />}>
                <EmployeeDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        >
          {/* Nested employee routes */}
          <Route
            path="attendance"
            element={
              <Suspense fallback={<PageLoader />}>
                <AttendanceEM />
              </Suspense>
            }
          />
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
            path="dtr-corrections"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeDtrcorrections/>
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
            path="leave-credit"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeLeavecredit />
              </Suspense>
            }
          />
          <Route
            path="undertime-request"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeUndertimeRequest />
              </Suspense>
            }
          />
          <Route
            path="schedule"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeSchedule />
              </Suspense>
            }
          />
          <Route
            path="ipcr"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeIPCRManagement />
              </Suspense>
            }
          />
          <Route
            path="ipcr/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeIPCRDetail />
              </Suspense>
            }
          />
          <Route
            path="performance"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeePerformanceReviews />
              </Suspense>
            }
          />
          <Route
            path="my-coaching"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeCoachingLog />
              </Suspense>
            }
          />
          <Route
            path="my-development-plans"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeDevelopmentPlan />
              </Suspense>
            }
          />
          <Route
            path="my-training"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeTrainingNeeds />
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
            path="notification-history"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeNotificationHistory />
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

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

        </Router>
      </AuthProvider>
    </DndProvider>
  );
}