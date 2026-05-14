import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const teacherNav = [
    { label: "Dashboard", to: "/teacher/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: "Students", to: "/teacher/students", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { label: "Alerts", to: "/teacher/alerts", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
];

const studentNav = [
    { label: "My Dashboard", to: "/student/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: "My Grades", to: "/student/grades", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { label: "Attendance", to: "/student/attendance", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

export default function Sidebar({ theme, toggleTheme }) {
    const { role, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const navItems = role === "teacher" ? teacherNav : studentNav;

    const handleLogout = async () => {
        await logout();
        navigate("/auth/login");
    };

    return (
        <aside className={`${collapsed ? "w-16" : "w-60"} transition-all duration-300 flex flex-col h-screen sticky top-0
      ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-r`}>

            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-inherit">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                {!collapsed && (
                    <span className={`font-bold text-lg tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        EduPulse
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`ml-auto p-1 rounded-lg transition ${theme === "dark" ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
                    </svg>
                </button>
            </div>

            {/* Role Badge */}
            {!collapsed && (
                <div className="px-4 pt-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${role === "teacher"
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                        {role === "teacher" ? "Teacher Portal" : "Student Portal"}
                    </span>
                </div>
            )}

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                                ? "bg-indigo-600 text-white"
                                : theme === "dark"
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`
                        }
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                        </svg>
                        {!collapsed && item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 py-4 border-t border-inherit space-y-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${theme === "dark"
                            ? "text-gray-400 hover:text-white hover:bg-gray-800"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                >
                    {theme === "dark" ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                    {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
                </button>

                {/* User + Logout */}
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user?.email?.[0]?.toUpperCase()}
                    </div>
                    {!collapsed && (
                        <>
                            <span className={`text-xs truncate flex-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                {user?.email}
                            </span>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
