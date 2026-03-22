import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navLink = (to, label, icon) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-primary/10 text-primary font-semibold"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50 shadow-sm">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <span className="material-symbols-outlined text-[20px]">auto_stories</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">LibraryConnect</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {navLink("/catalog", "Catalog", "auto_stories")}
        {isLoggedIn() && !isAdmin() && navLink("/dashboard", "Dashboard", "space_dashboard")}
        {isLoggedIn() && !isAdmin() && navLink("/wishlist", "Wishlist", "favorite")}
        {isAdmin() && navLink("/admin", "Admin", "admin_panel_settings")}
      </div>

      {/* Right: auth actions */}
      <div className="flex items-center gap-2">
        {!isLoggedIn() && pathname !== "/login" && (
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-primary border border-primary hover:bg-primary/5 transition-colors"
          >
            Sign In
          </Link>
        )}
        {!isLoggedIn() && pathname !== "/register" && (
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Sign Up
          </Link>
        )}
        {isLoggedIn() && (
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        )}
      </div>

    </nav>
  );
}
