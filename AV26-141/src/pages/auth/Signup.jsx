import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        const { data, error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    full_name: form.fullName,
                    role: form.role
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (data?.user) {
            // Force create the user entry in the public users table immediately
            const { error: dbError } = await supabase.from("users").upsert({
                id: data.user.id,
                email: form.email,
                full_name: form.fullName,
                role: form.role
            });

            if (dbError) {
                console.error("DB Error:", dbError);
                setError("Account created but role setup failed. Please contact admin.");
                setLoading(false);
                return;
            }
        }

        alert("Success! Your " + form.role + " account has been created. You can now log in.");
        navigate("/auth/login");
        setLoading(false);
    };

    const inputStyle = {
        background: "rgba(5,30,15,0.65)",
        border: "1px solid rgba(52,211,153,0.18)",
        color: "#ecfdf5",
        outline: "none",
    };
    const handleFocus = (e) => {
        e.target.style.borderColor = "#10b981";
        e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)";
    };
    const handleBlur = (e) => {
        e.target.style.borderColor = "rgba(52,211,153,0.18)";
        e.target.style.boxShadow = "none";
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-10"
            style={{
                background:
                    "radial-gradient(ellipse at 15% 25%, rgba(16,185,129,0.12) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(45,158,107,0.10) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(6,95,70,0.08) 0%, transparent 70%), #030d07",
            }}
        >
            {/* Grain overlay */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    opacity: 0.035,
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "repeat",
                    backgroundSize: "128px 128px",
                    zIndex: 0,
                }}
            />
            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                    zIndex: 0,
                }}
            />

            <div className="relative w-full max-w-md" style={{ zIndex: 1 }}>
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                boxShadow: "0 0 24px rgba(16,185,129,0.4)",
                            }}
                        >
                            <svg className="w-6 h-6" style={{ color: "#ecfdf5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span
                            className="text-2xl font-bold tracking-tight"
                            style={{ fontFamily: "'Syne', sans-serif", color: "#ecfdf5" }}
                        >
                            EduPulse
                        </span>
                    </div>
                    <p className="text-sm" style={{ color: "#6ee7b7" }}>
                        Learning Analytics &amp; Performance Prediction
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background: "rgba(5, 30, 15, 0.50)",
                        backdropFilter: "blur(18px) saturate(180%)",
                        WebkitBackdropFilter: "blur(18px) saturate(180%)",
                        border: "1px solid rgba(52, 211, 153, 0.18)",
                        borderTop: "1px solid rgba(52, 211, 153, 0.35)",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(16,185,129,0.06), inset 0 1px 0 rgba(52,211,153,0.18)",
                    }}
                >
                    <h2
                        className="text-xl font-semibold mb-1"
                        style={{ fontFamily: "'Syne', sans-serif", color: "#ecfdf5" }}
                    >
                        Create account
                    </h2>
                    <p className="text-sm mb-7" style={{ color: "#6ee7b7" }}>
                        Join EduPulse today
                    </p>

                    {error && (
                        <div
                            className="mb-5 px-4 py-3 rounded-lg text-sm"
                            style={{
                                background: "rgba(248,113,113,0.10)",
                                border: "1px solid rgba(248,113,113,0.25)",
                                color: "#f87171",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "#6ee7b7" }}>
                                I am a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {["teacher", "student"].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setForm({ ...form, role: r })}
                                        className="py-3 rounded-xl text-sm font-medium capitalize transition-all"
                                        style={
                                            form.role === r
                                                ? {
                                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                                    border: "1px solid #10b981",
                                                    color: "#ecfdf5",
                                                    boxShadow: "0 0 16px rgba(16,185,129,0.35)",
                                                }
                                                : {
                                                    background: "rgba(5,30,15,0.50)",
                                                    border: "1px solid rgba(52,211,153,0.18)",
                                                    color: "#6ee7b7",
                                                }
                                        }
                                    >
                                        {r === "teacher" ? "👨‍🏫 Teacher" : "🎓 Student"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "#6ee7b7" }}>Full name</label>
                            <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required
                                placeholder="Your full name"
                                className="w-full px-4 py-3 rounded-xl text-sm transition"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "#6ee7b7" }}>Email address</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required
                                placeholder="you@school.edu"
                                className="w-full px-4 py-3 rounded-xl text-sm transition"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "#6ee7b7" }}>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required
                                placeholder="Min. 6 characters"
                                className="w-full px-4 py-3 rounded-xl text-sm transition"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: "#6ee7b7" }}>Confirm password</label>
                            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required
                                placeholder="Re-enter password"
                                className="w-full px-4 py-3 rounded-xl text-sm transition"
                                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                            style={{
                                background: loading ? "#065f46" : "linear-gradient(135deg, #10b981, #059669)",
                                color: "#ecfdf5",
                                boxShadow: loading ? "none" : "0 0 24px rgba(16,185,129,0.4)",
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "linear-gradient(135deg, #34d399, #10b981)"; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "linear-gradient(135deg, #10b981, #059669)"; }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account...
                                </>
                            ) : "Create account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: "#34786a" }}>
                        Already have an account?{" "}
                        <Link
                            to="/auth/login"
                            className="font-medium transition"
                            style={{ color: "#10b981" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#34d399"}
                            onMouseLeave={e => e.currentTarget.style.color = "#10b981"}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
