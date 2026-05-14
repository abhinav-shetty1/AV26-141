import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// Teacher Pages (lazy stubs — replace with real pages)
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentList from "./pages/teacher/StudentList";
import Alerts from "./pages/teacher/Alerts";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import MyGrades from "./pages/student/MyGrades";
import MyAttendance from "./pages/student/MyAttendance";

// Layout wrapper with sidebar
function AppLayout({ theme, toggleTheme }) {
  return (
    <div className={`flex h-screen overflow-hidden ${theme === "dark" ? "bg-gray-950" : "bg-gray-50"}`}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const [theme, setTheme] = useState(() => localStorage.getItem("ep-theme") || "dark");

  useEffect(() => {
    initialize();
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ep-theme", next);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Teacher Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout theme={theme} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        >
          <Route path="/teacher/dashboard" element={<TeacherDashboard theme={theme} />} />
          <Route path="/teacher/students" element={<StudentList theme={theme} />} />
          <Route path="/teacher/alerts" element={<Alerts theme={theme} />} />
        </Route>

        {/* Student Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="student">
              <AppLayout theme={theme} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        >
          <Route path="/student/dashboard" element={<StudentDashboard theme={theme} />} />
          <Route path="/student/grades" element={<MyGrades theme={theme} />} />
          <Route path="/student/attendance" element={<MyAttendance theme={theme} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
