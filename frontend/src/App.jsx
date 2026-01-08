import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@components/ErrorBoundary"; 

//lazy load authentication
const Login = lazy(() => import("./Authentication/Login"));
const Register = lazy(() => import("./Authentication/Register"));
const VerifyAccount = lazy(() => import("./Authentication/VerifyAccount"));
const ForgotPassword = lazy(() => import("./Authentication/ForgotPassword"));
const ResetPassword = lazy(() => import("./Authentication/ResetPassword"));

// Lazy load dashboards 
const AdminDashboard = lazy(() => import("./pages/DashboardAdmin/AdminDashboard"));
const EmployeeDashboard = lazy(() => import("./pages/DashboardEmployee/EmployeeDashboard"));

//lazy load timekeepingAdminpages
const Attendance = lazy(() => import("./pages/TimekeepingAdmin/adminAttendance"));
const HRCalendar = lazy(() => import("./pages/TimekeepingAdmin/adminCalendar"));
const DailyTimeRecord = lazy(() => import("./pages/TimekeepingAdmin/adminDailyTimeRecord"));
const DTRCorrection = lazy(() => import("./pages/TimekeepingAdmin/admindtrCorrection"));
const LeaveRequestHR = lazy(() => import("./pages/TimekeepingAdmin/adminLeaverequest"));
const LeaveCredit = lazy(() => import("./pages/TimekeepingAdmin/adminLeavecredit"));
const Schedule = lazy(() => import("./pages/TimekeepingAdmin/adminSchedule"));
const UndertimeRequests = lazy(() => import("./pages/TimekeepingAdmin/adminUndertimerequest"));
const BiometricsMonitor = lazy(() => import("./pages/SettingsAdmin/BiometricsMonitor"));

//Settings Admin Pages
const BiometricsLogsUI = lazy(() => import("./pages/SettingsAdmin/BiometricsLogs"));
const BiometricsEnrollment = lazy(() => import("./pages/SettingsAdmin/BiometricsEnrollment"));
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
const CentralizedManagement = lazy(() => import("./pages/EmployeeManagementAdmin/EmployeeManagementHub"));

// Recruitment Pages
const JobPosting = lazy(() => import("./pages/Recruitment/JobPosting"));
const ApplicantList = lazy(() => import("./pages/Recruitment/ApplicantList"));
const InterviewKanban = lazy(() => import("./pages/Recruitment/InterviewKanban"));


// Reports Admin Pages
const DepartmentAttendanceReports = lazy(() => import("./pages/ReportsAdmin/DepartmentAttendanceReports"));

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
const EmployeeDepartment = lazy(() => import("./pages/EmployeeManagementEmployee/MyDepartmentPage"));
const EmployeeMyProfile = lazy(() => import("./pages/EmployeeManagementEmployee/MyProfilePage"));
const MyProfile = lazy(() => import("./pages/Settings/MyProfile"));
const EmployeeOrganizationalHub = lazy(() => import("./pages/EmployeeManagementEmployee/OrganizationalHubPage"));

const EmployeeMyMemos = lazy(() => import("./pages/EmployeeManagementEmployee/MyMemosPage"));
const EmployeeReviews = lazy(() => import("./pages/PerformanceManagement/EmployeeReviews"));
// Loading fallback component


// ang page loader na ito ay when the component is display loading message on the screen
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-gray-500">Loading...</div>
  </div>
);

import { AuthProvider } from "@context/AuthContext";
import { useAuth } from "@hooks/useAuth";

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

        {/* Public Career Pages - Accessible by everyone 
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
        */}

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
            path="department-attendance-reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <DepartmentAttendanceReports />
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
            path="management"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeOrganizationalHub />
              </Suspense>
            }
          />
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
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

        </Router>
      </AuthProvider>
    </DndProvider>
  );
}