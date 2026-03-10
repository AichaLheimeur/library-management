import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 md:px-10 py-4 sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <span className="material-symbols-outlined">auto_stories</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-primary">LibraryConnect</span>
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link to="/catalog" className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">Catalog</Link>
        {isLoggedIn() && <Link to="/dashboard" className="hover:text-primary/70 transition-colors">Dashboard</Link>}
        {isAdmin() && <Link to="/admin" className="hover:text-primary/70 transition-colors">Admin</Link>}
        {!isLoggedIn() && pathname !== "/login" && <Link to="/login" className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">Sign In</Link>}
        {!isLoggedIn() && pathname !== "/register" && <Link to="/register" className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">Sign Up</Link>}
        {isLoggedIn() && <button onClick={() => { logout(); navigate("/login"); }} className="hover:text-primary/70 transition-colors">Logout</button>}
      </div>
    </nav>
  );
}
