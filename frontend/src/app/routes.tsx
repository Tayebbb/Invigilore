import { createBrowserRouter } from "react-router";
import Home                   from "./pages/Home";
import Login                  from "./pages/Login";
import SignUp                 from "./pages/SignUp";
import ForgotPassword         from "./pages/ForgotPassword";
import ResetPassword          from "./pages/ResetPassword";
import TeacherDashboard       from "./pages/TeacherDashboard";

// Role-based dashboards
import AdminDashboard         from "./pages/admin/AdminDashboard";
import TeacherTestsPage       from "./pages/teacher/TeacherTestsPage";
import TeacherTestInfoPage    from "./pages/teacher/TeacherTestInfoPage";
import TeacherResultsDatabasePage from "./pages/teacher/TeacherResultsDatabasePage";
import TeacherAccountPage     from "./pages/teacher/TeacherAccountPage";
import TeacherRespondentsPage from "./pages/teacher/TeacherRespondentsPage";
import StudentDashboard       from "./pages/student/StudentDashboard";
import StudentExamAttemptPage from "./pages/student/StudentExamAttemptPage";
import StudentResultsPage     from "./pages/student/StudentResultsPage";
import StudentSubmissionHistoryPage from "./pages/student/StudentSubmissionHistoryPage";
import StudentProfilePage     from "./pages/student/StudentProfilePage";
import StudentAccountSettingsPage from "./pages/student/StudentAccountSettingsPage";
import StudentHelpSupportPage from "./pages/student/StudentHelpSupportPage";
import UserManagement         from "./pages/admin/UserManagement";
import RoleDashboardPlaceholder from "./pages/role/RoleDashboardPlaceholder";

// Auth guard
import ProtectedRoute         from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────────────────────
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: SignUp,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },

  // ── Legacy dashboard (kept for backwards compatibility) ──────────────────
  {
    path: "/dashboard",
    Component: TeacherDashboard,
  },

  // ── Role-based dashboards ────────────────────────────────────────────────
  // TODO: wrap each in <ProtectedRoute allowedRoles={[...]}> once auth is live.
  //       For now the routes are accessible without authentication so the UI
  //       can be developed and previewed freely.
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <TeacherTestsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/tests/:testId",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <TeacherTestInfoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/results-database",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <TeacherResultsDatabasePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/account",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <TeacherAccountPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/respondents",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <TeacherRespondentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/controller/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["controller"]}>
        <RoleDashboardPlaceholder roleName="Controller" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/invigilator/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["invigilator"]}>
        <RoleDashboardPlaceholder roleName="Invigilator" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/question-setter/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["question-setter"]}>
        <RoleDashboardPlaceholder roleName="Question Setter" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/moderator/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["moderator"]}>
        <RoleDashboardPlaceholder roleName="Moderator" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/exams/:examId/attempt",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentExamAttemptPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/results",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentResultsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/submissions",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentSubmissionHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/profile",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/account-settings",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentAccountSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/help-support",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentHelpSupportPage />
      </ProtectedRoute>
    ),
  },
]);