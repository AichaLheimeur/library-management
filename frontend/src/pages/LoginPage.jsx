import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import loginBg from "../assets/images/login-bg.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registered = location.state?.registered;

  // #4 — redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      navigate(isAdmin() ? "/admin" : "/dashboard", { replace: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { token } = res.data;
      const payload = JSON.parse(atob(token.split(".")[1]));
      login(payload, token);
      if (payload.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // #1 — background image plein écran avec overlay
    <div
      className="font-display text-slate-900 dark:text-slate-100 min-h-[calc(100vh-65px)] flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Overlay sombre léger */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 max-w-[1000px] w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Left Side: Branding and Image */}
        <div className="w-full md:w-1/2 relative bg-primary flex flex-col p-8 lg:p-12">
          <div className="flex items-center gap-3 text-white mb-auto relative z-10">
            <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">library_books</span>
            </div>
            <h2 className="text-white text-xl font-bold leading-tight tracking-tight">LibraryConnect</h2>
          </div>
          <div className="relative z-10 mt-20">
            <h1 className="text-white text-4xl font-bold mb-4">Discover your next favorite story.</h1>
            <p className="text-slate-300 text-lg">Manage your digital collection, reserve physical copies, and explore thousands of titles from anywhere.</p>
          </div>
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent"></div>
            <div
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuA-1TCgqwKhNAb7st3c0v4BfoDWZtwDfKNqK-eooBwraHliM9z0gYXu6Vl4jYbaiGkzC5thQ-pFuTzgHUWuG6JAT26dFn7AX1CVrRGub0cun411mvGTNynM4xBABxsc0jzx5_BLTRMvYxSU6BiCMSZyF8SBnN-OR1Xx9ikNgWrgNYjgMBAGbLWxn38dgy0x-olITiw1sofSbRG9bFYMMAgKsA8R6eiVVzE0iZQF1VEzbPLmRecNJyEfx9i56-BHuCFva7WskH9uhpA")` }}
            ></div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="mb-10">
            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Please enter your details to access the library system.</p>
          </div>

          {/* #2 — success message after registration */}
          {registered && (
            <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              Account created successfully. Please sign in.
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-14 pl-12 pr-4 text-base transition-all"
                  type="email"
                  placeholder="name@library.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal">
                  Password
                </label>
                <a className="text-primary dark:text-slate-400 text-xs font-medium hover:underline" href="#">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-14 pl-12 pr-12 text-base transition-all"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              {!loading && <span className="material-symbols-outlined text-lg">login</span>}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              New to the library?
              <Link className="text-primary font-bold hover:underline ml-1" to="/register">Create an account</Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-auto flex justify-center gap-6 pt-8">
            <a className="text-slate-400 hover:text-slate-600 text-xs font-medium" href="#">Help Center</a>
            <a className="text-slate-400 hover:text-slate-600 text-xs font-medium" href="#">Privacy Policy</a>
            <Link className="text-slate-400 hover:text-slate-600 text-xs font-medium" to="/catalog">Catalog</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
