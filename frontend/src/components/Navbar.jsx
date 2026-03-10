import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, isAdmin, logout } = useAuth();

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/catalog">Catalog</Link>
      {!isLoggedIn() && <Link to="/login">Login</Link>}
      {!isLoggedIn() && <Link to="/register">Register</Link>}
      {isLoggedIn() && <Link to="/dashboard">Dashboard</Link>}
      {isAdmin() && <Link to="/admin">Admin</Link>}
      {isLoggedIn() && <button onClick={logout}>Logout</button>}
    </nav>
  );
}
