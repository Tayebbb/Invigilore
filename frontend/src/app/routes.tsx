import { createBrowserRouter } from "react-router";
import Home                   from "./pages/Home";
import Login                  from "./pages/Login";
import SignUp                 from "./pages/SignUp";
import ForgotPassword         from "./pages/ForgotPassword";
import ResetPassword          from "./pages/ResetPassword";
import TeacherDashboard       from "./pages/TeacherDashboard";

// Role-based dashboards
import AdminDashboard         from "./pages/admin/AdminDashboard";
import MyExamsDashboard       from "./pages/teacher/MyExamsDashboard";
import CreateExam             from "./pages/teacher/CreateExam";
import StudentDashboard       from "./pages/student/StudentDashboard";
import UserManagement         from "./pages/admin/UserManagement";

// Auth guard
import ProtectedRoute         from "./auth/ProtectedRoute";
import ExamQuestionSetterRoute from "./auth/ExamQuestionSetterRoute";
import ExamRoleAccessRoute    from "./auth/ExamRoleAccessRoute";

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
        <MyExamsDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/teacher/exams/new",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <CreateExam />
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/questions",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <ExamQuestionSetterRoute>
          <CreateExam />
        </ExamQuestionSetterRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/moderator",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <ExamRoleAccessRoute requiredRole="moderator">
          <CreateExam />
        </ExamRoleAccessRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/invigilator",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <ExamRoleAccessRoute requiredRole="invigilator" requireLiveWindow>
          <CreateExam />
        </ExamRoleAccessRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: "/exam/:id/access",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <ExamRoleAccessRoute requiredRole="controller">
          <CreateExam />
        </ExamRoleAccessRoute>
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
]);