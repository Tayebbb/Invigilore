import { createBrowserRouter } from "react-router";
import Home                   from "./pages/Home";
import Login                  from "./pages/Login";
import SignUp                 from "./pages/SignUp";
import ForgotPassword         from "./pages/ForgotPassword";
import ResetPassword          from "./pages/ResetPassword";
import TeacherDashboard       from "./pages/TeacherDashboard";

// Role-based dashboards
import AdminDashboard         from "./pages/admin/AdminDashboard";
import TeacherDashboardNew    from "./pages/teacher/TeacherDashboardNew";
import StudentDashboard       from "./pages/student/StudentDashboard";

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
        <TeacherDashboardNew />
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