import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary"; 

//lazy load authentication
const Login = lazy(() => import("./Authentication/Login"));
const Register = lazy(() => import("./Authentication/Register"));

// Lazy load dashboards 
const AdminDashboard = lazy(() => import("./pages/DashboardAdmin/ADashboard"));
const EmployeeDashboard = lazy(() => import("./pages/DashboardEmployee/EDashboard"));

//lazy load timekeepingAdminpages
const Attendance = lazy(() => import("./pages/TimekeepingAdmin/adminAttendance"));
const HRCalendar = lazy(() => import("./pages/TimekeepingAdmin/adminCalendar"));
const DailyTimeRecord = lazy(() => import("./pages/TimekeepingAdmin/adminDailyTimeRecord"));
const DTRCorrection = lazy(() => import("./pages/TimekeepingAdmin/admindtrcorrection"));
const LeaveRequestHR = lazy(() => import("./pages/TimekeepingAdmin/adminLeaverequest"));
const LeaveFormsTable = lazy(() => import("./pages/TimekeepingAdmin/adminLeaveForms"));
const LeaveCredit = lazy(() => import("./pages/TimekeepingAdmin/adminLeavecredit"));
const Schedule = lazy(() => import("./pages/TimekeepingAdmin/adminSchedule"));
const Undertimeform = lazy(() => import("./pages/TimekeepingAdmin/adminUndertimeForm"));
const UndertimeRequests = lazy(() => import("./pages/TimekeepingAdmin/adminUndertimerequest"));

//Settings Admin Pages
const BiometricsLogsUI = lazy(() => import("./pages/SettingsAdmin/BiometricsLogs"));


// Lazy load employeeTimekeepingpages
const AttendanceEM = lazy(() => import("./pages/TimekeepingEmployee/EmployeeAttendance"));
const EmployeeCalendar = lazy(() => import("./pages/TimekeepingEmployee/EmployeeCalendar")); 
const LeaveRequest = lazy(() => import("./pages/TimekeepingEmployee/EmployeeLeaveRequest"));
const EmployeeLeaveForms= lazy(() => import("./pages/TimekeepingEmployee/EmployeeLeaveForms"));
const EmployeeDailyTimeRecord = lazy(() => import("./pages/TimekeepingEmployee/EmployeeDailyTimeRecord"));
const EmployeeDtrcorrections = lazy(() => import("./pages/TimekeepingEmployee/EmployeedtrCorrection"));
// Loading fallback component


// ang page loader na ito ay when the component is display loading message on the screen
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-gray-500">Loading...</div>
  </div>
);

/** ProtectedRoute — restricts access to allowed roles */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    console.log("ProtectedRoute: No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log("ProtectedRoute: Unauthorized user role:", user.role);
      if (user.role === "employee") {
        return <Navigate to="/employee-dashboard" replace />;
      }
      if (user.role === "hr" || user.role === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

/** PublicRoute — redirects logged-in users to their dashboard */
const PublicRoute = ({ children }) => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === "employee") return <Navigate to="/employee-dashboard" replace />;
      if (user.role === "admin" || user.role === "hr") return <Navigate to="/admin-dashboard" replace />;
    } catch (e) {
      // Invalid user, treat as logged out
    }
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected routes - Admin/HR Dashboard with nested routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <AdminDashboard />
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
            path="leave-forms"
            element={
              <Suspense fallback={<PageLoader />}>
                <LeaveFormsTable />
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
            path="undertime"
            element={
              <Suspense fallback={<PageLoader />}>
                <Undertimeform />
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
        </Route>

        {/* Protected routes - Employee Dashboard */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
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
            path="leave-forms"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmployeeLeaveForms />
              </Suspense>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}