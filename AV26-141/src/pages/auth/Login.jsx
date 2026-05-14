import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // Fetch user role from users table
        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (userData?.role === "teacher") {
            navigate("/teacher/dashboard");
        } else {
            navigate("/student/dashboard");
        }

        setLoading(false);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{
                background:
                    "radial-gradient(ellipse at 20% 20%, rgba(74,124,47,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(126,200,50,0.10) 0%, transparent 50%), #0a0f0a",
            }}
        >
            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(120,200,80,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,80,0.03) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "#7ec832", boxShadow: "0 0 20px rgba(126,200,50,0.35)" }}
                        >
                            <svg className="w-6 h-6" style={{ color: "#0a0f0a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span
                            className="text-2xl font-bold tracking-tight"
                            style={{ fontFamily: "'Outfit', sans-serif", color: "#f0f7ec" }}
                        >
                            EduPulse
                        </span>
                    </div>
                    <p className="text-sm" style={{ color: "#a8c59a" }}>
                        Learning Analytics &amp; Performance Prediction
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background: "rgba(20, 40, 20, 0.45)",
                        backdropFilter: "blur(16px) saturate(160%)",
                        WebkitBackdropFilter: "blur(16px) saturate(160%)",
                        border: "1px solid rgba(120, 200, 80, 0.18)",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(126,200,50,0.08), inset 0 1px 0 rgba(126,200,50,0.15)",
                    }}
                >
                    <h2
                        className="text-xl font-semibold mb-1"
                        style={{ fontFamily: "'Outfit', sans-serif", color: "#f0f7ec" }}
                    >
                        Welcome back
                    </h2>
                    <p className="text-sm mb-7" style={{ color: "#a8c59a" }}>
                        Sign in to your account
                    </p>

                    {error && (
                        <div
                            className="mb-5 px-4 py-3 rounded-lg text-sm"
                            style={{
                                background: "rgba(224,92,92,0.10)",
                                border: "1px solid rgba(224,92,92,0.25)",
                                color: "#e05c5c",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "#a8c59a" }}>
                                Email address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="you@school.edu"
                                className="w-full px-4 py-3 rounded-xl text-sm transition outline-none"
                                style={{
                                    background: "rgba(20,40,20,0.6)",
                                    border: "1px solid rgba(120,200,80,0.2)",
                                    color: "#f0f7ec",
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = "#7ec832";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(126,200,50,0.15)";
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = "rgba(120,200,80,0.2)";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium" style={{ color: "#a8c59a" }}>
                                    Password
                                </label>
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-xs transition"
                                    style={{ color: "#7ec832" }}
                                    onMouseEnter={e => e.currentTarget.style.color = "#8fd93e"}
                                    onMouseLeave={e => e.currentTarget.style.color = "#7ec832"}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl text-sm transition outline-none"
                                style={{
                                    background: "rgba(20,40,20,0.6)",
                                    border: "1px solid rgba(120,200,80,0.2)",
                                    color: "#f0f7ec",
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = "#7ec832";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(126,200,50,0.15)";
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = "rgba(120,200,80,0.2)";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 font-medium rounded-xl transition text-sm flex items-center justify-center gap-2"
                            style={{
                                background: loading ? "#4a7c2f" : "#7ec832",
                                color: "#0a0f0a",
                                boxShadow: loading ? "none" : "0 0 20px rgba(126,200,50,0.35)",
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#8fd93e"; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#7ec832"; }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: "#5a7a52" }}>
                        Don't have an account?{" "}
                        <Link
                            to="/auth/signup"
                            className="font-medium transition"
                            style={{ color: "#7ec832" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#8fd93e"}
                            onMouseLeave={e => e.currentTarget.style.color = "#7ec832"}
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
