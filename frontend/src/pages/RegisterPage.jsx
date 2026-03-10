import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import registerBg from "../assets/images/register-bg.jpg";
import registerBack from "../assets/images/register_back.jpg";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  // #4 — redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      navigate(isAdmin() ? "/admin" : "/dashboard", { replace: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // #3 — minimum password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/register", { email, password });
      // #2 — pass registered flag to login page
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="font-display text-slate-900 dark:text-slate-100 flex flex-col min-h-[calc(100vh-65px)] bg-cover bg-center relative"
      style={{ backgroundImage: `url(${registerBack})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 flex flex-col flex-1">
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">

            {/* Left Side: Welcome & Illustration */}
            <div
              className="hidden lg:flex flex-col justify-center p-12 text-white relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${registerBg})` }}
            >
              <div className="absolute inset-0 bg-primary/70"></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-black mb-6 leading-tight">Embark on Your <br />Next Adventure.</h1>
                <p className="text-slate-300 text-lg mb-8 max-w-md">Join our global community of readers. Access thousands of digital and physical resources with a single account.</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary bg-slate-100 p-2 rounded-full">check</span>
                    <span className="text-sm font-medium">Free access to 50,000+ e-books</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary bg-slate-100 p-2 rounded-full">check</span>
                    <span className="text-sm font-medium">Personalized reading recommendations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary bg-slate-100 p-2 rounded-full">check</span>
                    <span className="text-sm font-medium">Reserve physical copies online</span>
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Create Your Account</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Please fill in the details to get started.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                      <input
                        className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
                      <input
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2 py-2">
                  <input
                    className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
                    id="terms"
                    type="checkbox"
                    required
                  />
                  <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="terms">
                    By creating an account, you agree to our{" "}
                    <a className="text-primary font-semibold hover:underline" href="#">Terms of Service</a>{" "}
                    and{" "}
                    <a className="text-primary font-semibold hover:underline" href="#">Privacy Policy</a>.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </form>

              {/* Footer Link */}
              <div className="mt-8 text-center">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Already have an account?
                  <Link className="text-primary font-bold hover:underline ml-1" to="/login">Sign In</Link>
                </p>
              </div>
            </div>

          </div>
        </main>

        <footer className="p-6 text-center text-xs text-slate-500 dark:text-slate-500">
          © 2024 Library Management System. All rights reserved.
        </footer>

      </div>
    </div>
  );
}
