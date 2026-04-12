import { createBrowserRouter } from "react-router";
import Home                   from "./pages/Home";
import Login                  from "./pages/Login";
import Signup                 from "./pages/Signup";
import ForgotPassword         from "./pages/ForgotPassword";
import ResetPassword          from "./pages/ResetPassword";
import PublicExamLandingPage  from "./pages/student/PublicExamLandingPage";
import TeacherDashboard       from "./pages/TeacherDashboard";

// Role-based dashboards
import AdminDashboard         from "./pages/admin/AdminDashboard";
import MyExamsDashboard       from "./pages/teacher/MyExamsDashboard";
import CreateExam             from "./pages/teacher/CreateExam";
import TeacherResultsPage     from "./pages/teacher/TeacherResultsPage";
import StudentDashboard       from "./pages/student/StudentDashboard";
import StudentExamAttemptPage from "./pages/student/StudentExamAttemptPage";
import StudentResultsPage     from "./pages/student/StudentResultsPage";
import StudentSubmissionHistoryPage from "./pages/student/StudentSubmissionHistoryPage";
import StudentProfilePage     from "./pages/student/StudentProfilePage";
import StudentAccountSettingsPage from "./pages/student/StudentAccountSettingsPage";
import StudentHelpSupportPage from "./pages/student/StudentHelpSupportPage";
import UserManagement         from "./pages/admin/UserManagement";
import NotFound              from "./pages/NotFound";
import RouteErrorBoundary    from "./pages/RouteErrorBoundary";
import RoleDashboardPlaceholder from "./pages/role/RoleDashboardPlaceholder";

// Auth guard
import ProtectedRoute         from "./auth/ProtectedRoute";
import ExamQuestionSetterRoute from "./auth/ExamQuestionSetterRoute";
import ExamRoleAccessRoute    from "./auth/ExamRoleAccessRoute";

const routes = [
  // ── Public routes ────────────────────────────────────────────────────────
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/test/:id",
    Component: PublicExamLandingPage,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
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
      <ProtectedRoute allowedRoles={["admin"]} allowedPermissions={["users.manage"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <MyExamsDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/exams/new",
    element: (
      <ProtectedRoute allowedRoles={["admin", "teacher", "question-setter"]} allowedPermissions={["exams.create"]}>
        <CreateExam />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/results",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <TeacherResultsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/questions",
    element: (
      <ProtectedRoute allowedRoles={["admin", "teacher", "question-setter", "controller", "moderator"]} allowedPermissions={["questions.manage"]}>
        <ExamQuestionSetterRoute>
          <CreateExam />
        </ExamQuestionSetterRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/moderator",
    element: (
      <ProtectedRoute allowedRoles={["admin", "teacher", "moderator", "controller"]} allowedPermissions={["questions.review", "exams.approve_reject"]}>
        <ExamRoleAccessRoute requiredRole="moderator">
          <CreateExam />
        </ExamRoleAccessRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/invigilator",
    element: (
      <ProtectedRoute allowedRoles={["admin", "teacher", "invigilator", "controller"]}>
        <ExamRoleAccessRoute requiredRole="invigilator" requireLiveWindow>
          <CreateExam />
        </ExamRoleAccessRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/access",
    element: (
      <ProtectedRoute allowedRoles={["admin", "teacher", "controller"]} allowedPermissions={["exams.manage.access"]}>
        <CreateExam />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute allowedRoles={["admin"]} allowedPermissions={["users.manage", "roles.assign"]}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["student"]} allowedPermissions={["exams.view.assigned"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/exams/:examId/attempt",
    element: (
      <ProtectedRoute allowedRoles={["student"]} allowedPermissions={["exams.attempt"]}>
        <StudentExamAttemptPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/results",
    element: (
      <ProtectedRoute allowedRoles={["student"]} allowedPermissions={["results.view.own"]}>
        <StudentResultsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/submissions",
    element: (
      <ProtectedRoute allowedRoles={["student"]} allowedPermissions={["results.view.own"]}>
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
  {
    path: "*",
    Component: NotFound,
  },
];

export const router = createBrowserRouter(
  routes.map((route) => ({
    ...route,
    errorElement: <RouteErrorBoundary />,
  }))
);